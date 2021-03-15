use backend_rust::{api, db::Db, Opt, Result};
use std::sync::Arc;
use structopt::StructOpt;
use tokio::{signal, sync::Mutex};

#[tokio::main]
async fn main() -> Result<()> {
    pretty_env_logger::init();

    let mut opt = Opt::from_args();
    opt.read_config()?;

    let db = Db::new(opt.root_dir.as_path())?;
    let db_ref = Arc::new(Mutex::new(db));

    let routes = api::routes(db_ref.clone(), opt.auth_token_length);

    let server = tokio::spawn(async move {
        warp::serve(routes).run(([127, 0, 0, 1], opt.port)).await;
    });

    let shutdown_listener = tokio::spawn(async move {
        signal::ctrl_c().await.expect("failed to listen to ctrl+c");
    });

    tokio::select! {
        _ = shutdown_listener => {
            log::info!("shutting down");
            db_ref.lock().await.write()?;
        }
        _ = server => {}
    }

    Ok(())
}
