use backend_rust::{api, db::Db, Opt, Result};
use std::sync::Arc;
use structopt::StructOpt;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() -> Result<()> {
    pretty_env_logger::init();

    let mut opt = Opt::from_args();
    opt.read_config()?;

    let db = Db::new(opt.root_dir)?;

    let routes = api::routes(Arc::new(Mutex::new(db)));

    warp::serve(routes).run(([127, 0, 0, 1], opt.port)).await;

    Ok(())
}
