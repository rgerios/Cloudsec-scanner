import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///data/cloudsec.db")

def _ensure_directory(url: str) -> None:
    if url.startswith("sqlite"):
        path = url.split("///")[-1]
        db_path = Path(path)
        db_path.parent.mkdir(parents=True, exist_ok=True)

_ensure_directory(DATABASE_URL)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
