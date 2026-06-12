-- ============================================================================
-- PetaSuara — Skema PostgreSQL Inti
-- Sumber: Arsitektur Aplikasi v1.0, Bagian IV (Model Data Inti) & VI (Keamanan)
--
-- Aturan integritas terpenting (Bagian IV):
--   hasil_dokumen hanya boleh dibaca Analytics API jika qc_gate.status = 'LULUS'
--   untuk kombinasi (dapil, tugas, model_run) terkait; status 'INDIKATIF'
--   memaksa label peringatan eksplisit di seluruh penyajian.
--   Penegakan: view hasil_tersaji di bawah + pemeriksaan di lapisan API.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector: embedding utk BERTopic & pencarian semantik

-- ----------------------------------------------------------------------------
-- Tenant & engagement (unit isolasi akses)
-- ----------------------------------------------------------------------------

CREATE TABLE tenant (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama            text NOT NULL,
    jenis           text NOT NULL CHECK (jenis IN ('caleg', 'partai')),
    status_kontrak  text NOT NULL DEFAULT 'PROSPEK'
                    CHECK (status_kontrak IN ('PROSPEK', 'AKTIF', 'SELESAI', 'DIPUTUS')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    created_by      text NOT NULL
);

CREATE TABLE dapil (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kode        text NOT NULL UNIQUE,                -- mis. "JABAR-I"
    tingkat     text NOT NULL CHECK (tingkat IN ('RI', 'PROV', 'KAB-KOTA')),
    provinsi    text NOT NULL,
    bpp         bigint,                              -- bilangan pembagi pemilih
    kursi       smallint,
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  text NOT NULL
);

CREATE TABLE engagement (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenant(id),
    paket       text NOT NULL CHECK (paket IN
                ('DIAGNOSTIK', 'STRATEGI', 'WAR_ROOM', 'LISENSI_PARTAI')),
    dapil_id    uuid NOT NULL REFERENCES dapil(id),
    -- Denormalisasi partai klien untuk constraint konflik di bawah.
    partai      text NOT NULL,
    periode     daterange NOT NULL,
    status      text NOT NULL DEFAULT 'AKTIF'
                CHECK (status IN ('AKTIF', 'SELESAI', 'DIPUTUS')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  text NOT NULL
);

-- Konflik klien terkode (Arsitektur VI / Cetak Biru 9.3): tolak dua engagement
-- aktif dengan kombinasi (dapil, partai) identik. Skema LISENSI_PARTAI setara
-- untuk semua caleg partai itu, sehingga dikecualikan.
CREATE UNIQUE INDEX engagement_konflik_dapil_partai
    ON engagement (dapil_id, partai)
    WHERE status = 'AKTIF' AND paket <> 'LISENSI_PARTAI';

-- ----------------------------------------------------------------------------
-- Unit kerja: dapil, kandidat, sumber, dokumen
-- ----------------------------------------------------------------------------

CREATE TABLE kandidat (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dapil_id        uuid NOT NULL REFERENCES dapil(id),
    nama            text NOT NULL,
    partai          text NOT NULL,
    nomor_urut      smallint,
    status_petahana boolean NOT NULL DEFAULT false,
    -- Akun publik resmi figur publik kontestan; bukan data pribadi sensitif.
    akun_resmi      jsonb NOT NULL DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now(),
    created_by      text NOT NULL
);

CREATE TABLE sumber (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dapil_id     uuid NOT NULL REFERENCES dapil(id),
    jenis        text NOT NULL CHECK (jenis IN
                 ('MEDSOS', 'BERITA', 'AV', 'PEMILU', 'SURVEI')),
    platform     text NOT NULL,                      -- mis. instagram, rss, youtube, kpu
    url_dasar    text,
    konfigurasi  jsonb NOT NULL DEFAULT '{}',
    created_at   timestamptz NOT NULL DEFAULT now(),
    created_by   text NOT NULL
);

-- Korpus. Immutable setelah masuk; partisi per dapil saat volume menuntut
-- (dideklarasikan partitioned sejak awal agar migrasi tidak menyakitkan).
CREATE TABLE dokumen (
    id              uuid NOT NULL DEFAULT gen_random_uuid(),
    dapil_id        uuid NOT NULL REFERENCES dapil(id),
    sumber_id       uuid NOT NULL REFERENCES sumber(id),
    url             text,
    hash            text NOT NULL,                   -- hash konten utk dedup & provenance
    waktu_terbit    timestamptz,
    waktu_ambil     timestamptz NOT NULL,
    versi_konektor  text NOT NULL,
    teks_mentah     text NOT NULL,
    teks_bersih     text,
    bahasa          text,                            -- id / su / campuran / lainnya
    embedding       vector(768),
    created_at      timestamptz NOT NULL DEFAULT now(),
    created_by      text NOT NULL,
    PRIMARY KEY (dapil_id, id),
    UNIQUE (dapil_id, hash)
) PARTITION BY LIST (dapil_id);

-- Partisi default untuk pengembangan; produksi: satu partisi per dapil aktif.
CREATE TABLE dokumen_default PARTITION OF dokumen DEFAULT;

-- ----------------------------------------------------------------------------
-- Model run & hasil (reprodusibilitas penuh)
-- ----------------------------------------------------------------------------

CREATE TABLE model_run (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis        text NOT NULL CHECK (jenis IN ('TOPIK', 'SENTIMEN', 'POSISI')),
    versi_model  text NOT NULL,                      -- mis. indobert-sentimen-pol-1.2
    versi_prompt text,                               -- utk LLM-annotator; merujuk prompts/
    parameter    jsonb NOT NULL DEFAULT '{}',
    dapil_id     uuid NOT NULL REFERENCES dapil(id),
    periode      daterange NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    created_by   text NOT NULL
);

CREATE TABLE hasil_dokumen (
    dokumen_dapil_id   uuid NOT NULL,
    dokumen_id         uuid NOT NULL,
    model_run_id       uuid NOT NULL REFERENCES model_run(id),
    label              text NOT NULL,
    skor               double precision,
    kandidat_target_id uuid REFERENCES kandidat(id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    created_by         text NOT NULL,
    PRIMARY KEY (model_run_id, dokumen_id, dokumen_dapil_id),
    FOREIGN KEY (dokumen_dapil_id, dokumen_id) REFERENCES dokumen (dapil_id, id)
);

CREATE TABLE topik (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_run_id uuid NOT NULL REFERENCES model_run(id),
    -- Label final WAJIB diberikan manusia setelah inspeksi dokumen representatif.
    label_manusia text,
    kata_kunci   text[] NOT NULL,
    volume       integer NOT NULL,
    koherensi    double precision,
    created_at   timestamptz NOT NULL DEFAULT now(),
    created_by   text NOT NULL
);

-- ----------------------------------------------------------------------------
-- Subsistem QC: gold standard, reliabilitas, gerbang
-- ----------------------------------------------------------------------------

CREATE TABLE penilai (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by text NOT NULL
);

CREATE TABLE gold_label (
    dokumen_dapil_id uuid NOT NULL,
    dokumen_id       uuid NOT NULL,
    tugas            text NOT NULL,                  -- mis. sentimen, posisi_pesan
    penilai_id       uuid NOT NULL REFERENCES penilai(id),
    label            text NOT NULL,
    ronde            smallint NOT NULL DEFAULT 1,    -- 1=pelabelan ganda, 2=adjudikasi
    created_at       timestamptz NOT NULL DEFAULT now(),
    created_by       text NOT NULL,
    PRIMARY KEY (dokumen_id, dokumen_dapil_id, tugas, penilai_id, ronde),
    FOREIGN KEY (dokumen_dapil_id, dokumen_id) REFERENCES dokumen (dapil_id, id)
);

-- Gerbang QC — dirujuk Analytics API sebelum menyajikan hasil apa pun.
-- Ambang (Cetak Biru VI): κ/α >= 0,70 antar-penilai; Macro F1 >= 0,75 utk LULUS.
CREATE TABLE qc_gate (
    dapil_id      uuid NOT NULL REFERENCES dapil(id),
    tugas         text NOT NULL,
    model_run_id  uuid NOT NULL REFERENCES model_run(id),
    kappa         double precision,
    macro_f1      jsonb,                             -- {"makro": x, "per_kelas": {...}}
    status        text NOT NULL DEFAULT 'TOLAK'
                  CHECK (status IN ('LULUS', 'INDIKATIF', 'TOLAK')),
    disetujui_oleh text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    created_by    text NOT NULL,
    PRIMARY KEY (dapil_id, tugas, model_run_id)
);

-- Satu-satunya jalan baca hasil bagi lapisan penyajian. Analytics API membaca
-- view ini, bukan hasil_dokumen langsung; INDIKATIF ikut tersaji tetapi wajib
-- membawa flag peringatan.
CREATE VIEW hasil_tersaji AS
SELECT h.*,
       g.status   AS qc_status,
       g.kappa    AS qc_kappa,
       g.macro_f1 AS qc_macro_f1,
       (g.status = 'INDIKATIF') AS wajib_label_peringatan
FROM hasil_dokumen h
JOIN model_run m ON m.id = h.model_run_id
JOIN qc_gate g
  ON g.model_run_id = h.model_run_id
 AND g.dapil_id     = m.dapil_id
WHERE g.status IN ('LULUS', 'INDIKATIF');

-- ----------------------------------------------------------------------------
-- Deliverable & audit
-- ----------------------------------------------------------------------------

CREATE TABLE deliverable (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id uuid NOT NULL REFERENCES engagement(id),
    jenis         text NOT NULL,                     -- diagnostik, benchmark, brief, playbook
    versi         text NOT NULL,
    path_objek    text NOT NULL,                     -- kunci object storage per engagement
    diserahkan_pada timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    created_by    text NOT NULL
);

CREATE TABLE audit_log (
    id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aktor  text NOT NULL,
    aksi   text NOT NULL,
    objek  text NOT NULL,
    waktu  timestamptz NOT NULL DEFAULT now(),
    detail jsonb NOT NULL DEFAULT '{}'
);

-- Append-only: cabut hak ubah/hapus dari semua peran aplikasi.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- Isolasi tenant: row-level security
-- (lapis kedua setelah cakupan token API; lapis ketiga: folder object storage
--  per engagement untuk deliverable)
-- ----------------------------------------------------------------------------

ALTER TABLE tenant      ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement  ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable ENABLE ROW LEVEL SECURITY;

-- Aplikasi men-set: SET app.tenant_id = '<uuid>' per koneksi/permintaan portal.
CREATE POLICY tenant_isolasi ON tenant
    USING (id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY engagement_isolasi ON engagement
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY deliverable_isolasi ON deliverable
    USING (engagement_id IN (
        SELECT id FROM engagement
        WHERE tenant_id = current_setting('app.tenant_id', true)::uuid));

-- CATATAN PRIVASI (Arsitektur VI / Cetak Biru 9.2):
-- Skema ini SENGAJA tidak memiliki tabel individu pemilih. Unit analisis
-- terkecil adalah dokumen publik dan agregat wilayah (minimum kelurahan).
-- Jangan pernah menambahkan tabel DPT, NIK, atau profil pemilih perorangan.
