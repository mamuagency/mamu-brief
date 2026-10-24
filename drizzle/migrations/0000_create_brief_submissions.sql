CREATE TABLE public.brief_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lang TEXT NOT NULL,
  payload JSONB NOT NULL,
  image_paths TEXT[] NOT NULL DEFAULT '{}'
);

GRANT INSERT ON public.brief_submissions TO anon;
GRANT ALL ON public.brief_submissions TO service_role;

ALTER TABLE public.brief_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit a brief"
ON public.brief_submissions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "anon can upload brief reference images"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'brief-references');

CREATE POLICY "anyone can view brief reference images"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'brief-references');

CREATE POLICY "anon can remove brief reference images"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'brief-references');