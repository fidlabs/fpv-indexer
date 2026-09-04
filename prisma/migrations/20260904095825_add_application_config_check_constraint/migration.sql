ALTER TABLE application_config
ADD CONSTRAINT single_application_config_check CHECK (id = 1);