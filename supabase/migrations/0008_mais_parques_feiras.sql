-- Migration: mais_parques_feiras
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Amplia o catálogo (2 parques/3 feiras -> 6 parques/12 feiras) para demonstração e uso real.

with p as (
  insert into guery_feiras.parks (nome) values
    ('Parque de Casa Forte'), ('Marco Zero'), ('Parque da Macaxeira'),
    ('Parque Santana'), ('Praça do Derby')
  returning id, nome
)
insert into guery_feiras.fairs (park_id, nome, local, descricao, regras, taxa, max_participantes, dias_semana, data_inicio, data_fim)
select
  p.id, f.nome, f.local, f.descricao, f.regras, f.taxa, f.maxp, f.dias, current_date, current_date + 90
from p
join (values
  ('Parque de Casa Forte', 'Feira Tradicional de Casa Forte', 'entrada principal', 'Feira de artesanato e gastronomia aos sábados.', 'Chegar 1h antes. Montar até 8h.', 220.00, 45, array[6]::smallint[]),
  ('Parque de Casa Forte', 'Feira Gourmet de Casa Forte', 'área do coreto', 'Feira gastronômica aos domingos.', 'Espaço 2x2m. Energia inclusa.', 190.00, 35, array[0]::smallint[]),
  ('Marco Zero', 'Feira de Antiguidades do Marco Zero', 'Praça do Marco Zero', 'Feira de antiguidades e colecionáveis aos domingos.', 'Produtos usados/vintage preferenciais.', 160.00, 60, array[0]::smallint[]),
  ('Marco Zero', 'Feira Noturna do Marco Zero', 'orla do Bairro do Recife', 'Feira noturna de moda e cultura às sextas.', 'Montagem a partir das 16h.', 170.00, 50, array[5]::smallint[]),
  ('Parque da Macaxeira', 'Feira Comunitária da Macaxeira', 'quadra poliesportiva', 'Feira comunitária de bairro aos sábados.', 'Prioridade a produtores locais.', 120.00, 30, array[6]::smallint[]),
  ('Parque Santana', 'Feira de Artesanato de Santana', 'alameda central', 'Feira de artesanato aos domingos.', 'Produtos autorais preferenciais.', 140.00, 35, array[0]::smallint[]),
  ('Parque Santana', 'Feira Kids de Santana', 'área infantil', 'Feira voltada a brinquedos e moda infantil aos sábados.', 'Espaço 2x2m.', 130.00, 25, array[6]::smallint[]),
  ('Praça do Derby', 'Feira do Derby', 'em frente ao Clube Português', 'Feira de quarta à noite.', 'Montagem a partir das 17h.', 150.00, 40, array[3]::smallint[]),
  ('Praça do Derby', 'Feira Vegana do Derby', 'gramado central', 'Feira de produtos naturais e vegetarianos aos sábados.', 'Somente produtos plant-based.', 160.00, 30, array[6]::smallint[])
) as f(park_nome, nome, local, descricao, regras, taxa, maxp, dias)
  on f.park_nome = p.nome;

grant select, insert, update on all tables in schema guery_feiras to authenticated;
