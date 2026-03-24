import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "history.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS downloads (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                title     TEXT,
                url       TEXT,
                thumbnail TEXT,
                platform  TEXT,
                format    TEXT,
                size      TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()


async def save_download(title: str, url: str, thumbnail: str, platform: str, fmt: str, size: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO downloads (title, url, thumbnail, platform, format, size) VALUES (?, ?, ?, ?, ?, ?)",
            (title, url, thumbnail, platform, fmt, size),
        )
        await db.commit()


async def get_history(limit: int = 10, offset: int = 0):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM downloads ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
