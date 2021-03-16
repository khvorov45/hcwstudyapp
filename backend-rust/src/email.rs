use crate::Result;
use lettre::{
    message::header::ContentType, AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};

pub struct Mailer {
    pub from: String,
    pub transport: AsyncSmtpTransport<Tokio1Executor>,
}

pub struct Email {
    pub to: String,
    pub subject: String,
    pub body: String,
}

impl Email {
    pub async fn send(&self, mailer: std::sync::Arc<Mailer>) -> Result<()> {
        let email = Message::builder()
            .from(mailer.from.as_str().parse()?)
            .reply_to("hcwcohortstudy@influenzacentre.org".parse()?)
            .to(self.to.as_str().parse()?)
            .subject(self.subject.as_str())
            .header(ContentType::html())
            .body(self.body.clone())?;
        mailer.transport.send(email).await?;
        Ok(())
    }
}
