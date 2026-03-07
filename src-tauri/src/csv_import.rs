use rusqlite::Connection;
use serde::Deserialize;
use std::fs::File;
use std::path::Path;

use crate::db;
use crate::models::{ActivityLog, Media};

#[derive(Debug, Deserialize)]
struct CsvRow {
    #[serde(rename = "Date")]
    date: String,
    #[serde(rename = "Log Name")]
    log_name: String,
    #[serde(rename = "Media Type")]
    media_type: String,
    #[serde(rename = "Duration")]
    duration: i64,
    #[serde(rename = "Language")]
    language: String,
}

pub fn import_csv(conn: &mut Connection, file_path: &str) -> Result<usize, String> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err("File not found".into());
    }

    let file = File::open(path).map_err(|e| e.to_string())?;
    let mut rdr = csv::ReaderBuilder::new().has_headers(true).from_reader(file);

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut imported_count = 0;

    for result in rdr.deserialize() {
        let record: CsvRow = match result {
            Ok(r) => r,
            Err(e) => {
                println!("Error parsing row: {:?}", e);
                continue;
            }
        };

        // Format Date from YYYY/MM/DD to YYYY-MM-DD
        let formatted_date = record.date.replace("/", "-");

        // Check if media exists
        let media_id: i64 = match tx.query_row(
            "SELECT id FROM media WHERE title = ?1",
            [&record.log_name],
            |row| row.get(0),
        ) {
            Ok(id) => id,
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                // Create new media
                let new_media = Media {
                    id: None,
                    title: record.log_name.clone(),
                    media_type: record.media_type.clone(),
                    status: "Completed".into(), // Default to Completed for historical data
                    language: record.language.clone(),
                };
                
                match db::add_media_with_id(&tx, &new_media) {
                    Ok(id) => id,
                    Err(e) => {
                        println!("Error creating media {}: {}", record.log_name, e);
                        continue;
                    }
                }
            }
            Err(e) => {
                println!("Database error finding media: {}", e);
                continue;
            }
        };

        let new_log = ActivityLog {
            id: None,
            media_id,
            duration_minutes: record.duration,
            date: formatted_date,
        };

        match db::add_log(&tx, &new_log) {
            Ok(_) => imported_count += 1,
            Err(e) => println!("Error adding log: {}", e),
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(imported_count)
}
