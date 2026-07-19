import os
import sys
from logging.config import fileConfig
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine
from alembic import context

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import Base
from app.models import *  # noqa: F401, F403

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/collab_editor")


def run_migrations_online():
    connectable = create_engine(DATABASE_URL)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()