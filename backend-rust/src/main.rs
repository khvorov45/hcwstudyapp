use backend_rust::data::current;
use backend_rust::db::Db;
use backend_rust::{Opt, Result};
use serde::de::DeserializeOwned;
use std::io::{self, Write};
use structopt::StructOpt;

fn main() -> Result<()> {
    pretty_env_logger::init();

    let mut opt = Opt::from_args();
    opt.read_config()?;

    let mut db = Db::new(opt.root_dir)?;

    message_loop_forever(&mut db, process_db_message, "db")?;

    Ok(())
}

fn message_loop_forever<T: std::fmt::Debug>(
    db: &mut Db,
    process: fn(&str, &mut Db) -> Result<T>,
    prompt: &str,
) -> Result<()> {
    loop {
        let line = read_input(prompt)?;
        match process(line.as_str(), db) {
            Ok(_) => println!("success"),
            Err(e) => {
                println!("{}", e)
            }
        }
    }
}

fn message_loop_return<T>(
    db: &mut Db,
    process: fn(&str, &mut Db) -> Result<T>,
    prompt: &str,
) -> Result<T> {
    loop {
        let line = read_input(prompt)?;
        match process(line.as_str(), db) {
            Ok(data) => return Ok(data),
            Err(e) => {
                println!("{}", e)
            }
        }
    }
}

fn read_input(prompt: &str) -> Result<String> {
    let mut line = String::new();
    print_prompt(format!("{}>>> ", prompt).as_str())?;
    io::stdin().read_line(&mut line)?;
    let line_trimmed = line.trim();
    if line_trimmed == "exit" {
        anyhow::bail!("exit");
    }
    Ok(line_trimmed.to_string())
}

fn print_prompt(prompt: &str) -> Result<()> {
    print!("{}", prompt);
    io::stdout().flush()?;
    Ok(())
}

fn process_db_message(message: &str, db: &mut Db) -> Result<()> {
    match message {
        "write" => db.write()?,
        "insert" => message_loop_forever(db, process_insert_message, "table")?,
        line => println!("unrecognized: {}", line),
    };
    Ok(())
}

fn process_insert_message(message: &str, db: &mut Db) -> Result<()> {
    let prompt = "data";
    match message {
        "User" => {
            let data = message_loop_return(db, process_data_message::<current::User>, prompt)?;
            db.users.insert(data);
        }
        "Token" => {
            let data = message_loop_return(db, process_data_message::<current::Token>, prompt)?;
            db.tokens.insert(data);
        }
        line => println!("unrecognized table: {}", line),
    };
    Ok(())
}

fn process_data_message<T: DeserializeOwned>(message: &str, _db: &mut Db) -> Result<T> {
    let data = serde_json::from_str::<T>(message)?;
    Ok(data)
}
