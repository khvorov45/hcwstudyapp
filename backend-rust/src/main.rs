use backend_rust::data::current;
use backend_rust::db::Db;
use backend_rust::{Opt, Result};
use rustyline::Editor;
use serde::de::DeserializeOwned;
use structopt::StructOpt;

fn main() -> Result<()> {
    pretty_env_logger::init();

    let mut opt = Opt::from_args();
    opt.read_config()?;

    let mut db = Db::new(opt.root_dir)?;

    let mut rl = Editor::<()>::new();

    message_loop_forever(&mut db, process_db_message, &mut rl, "db")?;

    Ok(())
}

type Input = Editor<()>;

fn message_loop_forever<T: std::fmt::Debug>(
    db: &mut Db,
    process: fn(&str, &mut Db, rl: &mut Input) -> Result<T>,
    rl: &mut Input,
    prompt: &str,
) -> Result<()> {
    loop {
        let line = read_input(prompt, rl)?;
        match process(line.as_str(), db, rl) {
            Ok(_) => println!("success"),
            Err(e) => println!("{}", e),
        }
    }
}

fn message_loop_return<T>(
    db: &mut Db,
    process: fn(&str, &mut Db) -> Result<T>,
    rl: &mut Input,
    prompt: &str,
) -> Result<T> {
    loop {
        let line = read_input(prompt, rl)?;
        match process(line.as_str(), db) {
            Ok(data) => return Ok(data),
            Err(e) => println!("{}", e),
        }
    }
}

fn read_input(prompt: &str, rl: &mut Input) -> Result<String> {
    let line = rl.readline(format!("{}>>> ", prompt).as_str())?;
    rl.add_history_entry(line.as_str());
    Ok(line)
}

fn process_db_message(message: &str, db: &mut Db, rl: &mut Input) -> Result<()> {
    match message {
        "write" => db.write()?,
        "insert" => message_loop_forever(db, process_insert_message, rl, "table")?,
        line => println!("unrecognized: {}", line),
    };
    Ok(())
}

fn process_insert_message(message: &str, db: &mut Db, rl: &mut Input) -> Result<()> {
    let prompt = "data";
    match message {
        "User" => {
            let data = message_loop_return(db, process_data_message::<current::User>, rl, prompt)?;
            db.insert_user(data)?;
        }
        "Token" => {
            let data = message_loop_return(db, process_data_message::<current::Token>, rl, prompt)?;
            db.insert_token(data)?;
        }
        line => println!("unrecognized table: {}", line),
    };
    Ok(())
}

fn process_data_message<T: DeserializeOwned>(message: &str, _db: &mut Db) -> Result<T> {
    let data = serde_json::from_str::<T>(message)?;
    Ok(data)
}
