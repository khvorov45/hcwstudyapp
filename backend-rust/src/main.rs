use backend_rust::db::Db;
use backend_rust::{Opt, Result};
use std::io::{self, Write};
use structopt::StructOpt;

fn main() -> Result<()> {
    pretty_env_logger::init();

    let mut opt = Opt::from_args();
    opt.read_config()?;

    let db = Db::new(opt.root_dir)?;

    // Listen to messages
    let input = io::stdin();
    let mut output = io::stdout();
    loop {
        let mut line = String::new();
        print!("db>>> ");
        output.flush()?;
        input.read_line(&mut line)?;
        match line.trim() {
            "write" => db.write()?,
            line => println!("unrecognized: {}", line),
        }
    }
}
