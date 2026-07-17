-- Migration: fairs_horario_categorias_status
-- Campos e status alinhados ao design handoff da Gestão de Feiras.

alter table guery_feiras.fairs
  add column if not exists horario text,
  add column if not exists categorias text[] not null default '{}';

alter table guery_feiras.fairs drop constraint if exists fairs_status_check;
alter table guery_feiras.fairs
  add constraint fairs_status_check
  check (status in ('aberto', 'rascunho', 'encerrada', 'inativo'));

notify pgrst, 'reload schema';
