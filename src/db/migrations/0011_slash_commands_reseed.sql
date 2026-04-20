-- Migration: 0011_slash_commands_reseed
-- AUT-257: Reseed slash_commands con 8 chips estilo /comando (una palabra)
-- Reemplaza los 6 comandos anteriores por 8 con prompt_template rico en contexto.
--> statement-breakpoint
TRUNCATE "slash_commands" RESTART IDENTITY;
--> statement-breakpoint
INSERT INTO "slash_commands" ("comando", "label", "modulo", "prompt_template", "orden") VALUES
  ('/feedlot',    'Feedlot',    'feedlot', 'Focus en feedlot: muéstrame últimos pesajes, GDP por lote, días en engorde y alertas de rendimiento. Incluye artifact con tabla comparativa.', 1),
  ('/medieriaFT', 'Medieria FT', 'feedlot', 'Focus en mediería Frigo Temuco: inventario de animales, últimos pesajes, GDP promedio. Usa tabla:medieros para identificar el contrato.', 2),
  ('/amsa',       'AMSA',       'feedlot', 'Focus en mediería AMSA Mollendo: inventario de animales, últimos pesajes, GDP promedio.', 3),
  ('/novillos',   'Novillos',   NULL,      'Focus en novillos del predio activo: conteo, últimos pesajes, GDP. Filtra modulo_actual:feedlot o tipo_ganado:Novillo.', 4),
  ('/partos',     'Partos',     'crianza', 'Muéstrame los últimos partos del predio (año 2026): fecha, resultado, tasa por mes. Incluye artifact con resumen.', 5),
  ('/pesajes',    'Pesajes',    NULL,      'Últimos pesajes del predio con GDP por lote. Muéstrame top 5 animales con mejor ganancia diaria. Artifact con tabla GDP por lote.', 6),
  ('/recria',     'Recría',     'crianza', 'Focus en recría: inventario de animales en crecimiento, pesajes recientes, GDP por lote de recría.', 7),
  ('/ventas',     'Ventas',     NULL,      'Ventas 2026: total animales vendidos, peso promedio, destino más frecuente. Incluye comparación si hay datos de años anteriores.', 8);
