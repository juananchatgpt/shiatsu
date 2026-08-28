-- Un evento es información editorial de APSE y no debe desaparecer al borrar a su organizador.
-- Antes de borrar al socio, administración debe reasignar sus eventos desde la ficha del evento.
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_organizer_membership_id_fkey;

ALTER TABLE events
  ADD CONSTRAINT events_organizer_membership_id_fkey
  FOREIGN KEY (organizer_membership_id) REFERENCES memberships(id) ON DELETE RESTRICT;
