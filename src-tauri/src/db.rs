use rusqlite::{params, Connection, Result};
use std::fs;
use tauri::Manager;

use crate::models::{ActivityLog, ActivitySummary, Media, DailyHeatmap};

pub fn init_db(app_handle: &tauri::AppHandle, profile_name: &str) -> Result<Connection> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    let file_name = format!("kechimochi_{}.db", profile_name);
    let db_path = app_dir.join(file_name);

    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL UNIQUE,
            media_type TEXT NOT NULL,
            status TEXT NOT NULL,
            language TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            media_id INTEGER NOT NULL,
            duration_minutes INTEGER NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY(media_id) REFERENCES media(id)
        )",
        [],
    )?;

    Ok(conn)
}

pub fn wipe_profile(app_handle: &tauri::AppHandle, profile_name: &str) -> std::result::Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let file_name = format!("kechimochi_{}.db", profile_name);
    let db_path = app_dir.join(file_name);
    
    if db_path.exists() {
        fs::remove_file(db_path).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// Media Operations
pub fn get_all_media(conn: &Connection) -> Result<Vec<Media>> {
    let mut stmt = conn.prepare("SELECT id, title, media_type, status, language FROM media")?;
    let media_iter = stmt.query_map([], |row| {
        Ok(Media {
            id: row.get(0)?,
            title: row.get(1)?,
            media_type: row.get(2)?,
            status: row.get(3)?,
            language: row.get(4)?,
        })
    })?;

    let mut media_list = Vec::new();
    for media in media_iter {
        media_list.push(media?);
    }
    Ok(media_list)
}

pub fn add_media_with_id(conn: &Connection, media: &Media) -> Result<i64> {
    conn.execute(
        "INSERT INTO media (title, media_type, status, language) VALUES (?1, ?2, ?3, ?4)",
        params![media.title, media.media_type, media.status, media.language],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn update_media(conn: &Connection, media: &Media) -> Result<()> {
    conn.execute(
        "UPDATE media SET title = ?1, media_type = ?2, status = ?3, language = ?4 WHERE id = ?5",
        params![
            media.title,
            media.media_type,
            media.status,
            media.language,
            media.id.unwrap() // Must have an ID
        ],
    )?;
    Ok(())
}

pub fn delete_media(conn: &Connection, id: i64) -> Result<()> {
    // Also delete associated logs
    conn.execute("DELETE FROM activity_logs WHERE media_id = ?1", params![id])?;
    conn.execute("DELETE FROM media WHERE id = ?1", params![id])?;
    Ok(())
}

// Activity Log Operations
pub fn add_log(conn: &Connection, log: &ActivityLog) -> Result<i64> {
    conn.execute(
        "INSERT INTO activity_logs (media_id, duration_minutes, date) VALUES (?1, ?2, ?3)",
        params![log.media_id, log.duration_minutes, log.date],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn delete_log(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM activity_logs WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_logs(conn: &Connection) -> Result<Vec<ActivitySummary>> {
    let mut stmt = conn.prepare(
        "SELECT a.id, a.media_id, m.title, m.media_type, a.duration_minutes, a.date, m.language 
         FROM activity_logs a 
         JOIN media m ON a.media_id = m.id
         ORDER BY a.date DESC",
    )?;
    let logs_iter = stmt.query_map([], |row| {
        Ok(ActivitySummary {
            id: row.get(0)?,
            media_id: row.get(1)?,
            title: row.get(2)?,
            media_type: row.get(3)?,
            duration_minutes: row.get(4)?,
            date: row.get(5)?,
            language: row.get(6)?,
        })
    })?;

    let mut log_list = Vec::new();
    for log in logs_iter {
        log_list.push(log?);
    }
    Ok(log_list)
}

pub fn get_heatmap(conn: &Connection) -> Result<Vec<DailyHeatmap>> {
    let mut stmt = conn.prepare(
        "SELECT date, SUM(duration_minutes) as total_minutes 
         FROM activity_logs 
         GROUP BY date 
         ORDER BY date ASC",
    )?;
    let heatmap_iter = stmt.query_map([], |row| {
        Ok(DailyHeatmap {
            date: row.get(0)?,
            total_minutes: row.get(1)?,
        })
    })?;

    let mut heatmap_list = Vec::new();
    for hm in heatmap_iter {
        heatmap_list.push(hm?);
    }
    Ok(heatmap_list)
}
