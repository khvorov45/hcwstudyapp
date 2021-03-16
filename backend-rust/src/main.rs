use backend_rust::{api, db::Db, email::Mailer, Opt, Result};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, Tokio1Executor};
use std::sync::Arc;
use structopt::StructOpt;
use tokio::{signal, sync::Mutex};

#[tokio::main]
async fn main() -> Result<()> {
    pretty_env_logger::init();

    let mut opt = Opt::from_args();
    opt.read_config()?;

    let db = Db::new(opt.root_dir.as_path(), opt.default_admin_email.as_str())?;
    let email_cred = Credentials::new(opt.email_username.clone(), opt.email_password.clone());
    let transport = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(opt.email_host.as_str())?
        .credentials(email_cred)
        .build();
    let mailer = Mailer {
        from: format!("NIH HCW Study <{}>", opt.email_username.clone()),
        transport,
    };

    let db_ref = Arc::new(Mutex::new(db));
    let opt_ref = Arc::new(opt);
    let mailer_ref = Arc::new(mailer);

    let routes = api::routes(db_ref.clone(), opt_ref.clone(), mailer_ref);

    let server = tokio::spawn(async move {
        warp::serve(routes)
            .run(([127, 0, 0, 1], opt_ref.port))
            .await;
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
