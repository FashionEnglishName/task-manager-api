const sgMail = require("@sendgrid/mail");
 
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: "dongminghui1313@gmail.com",
		subject: "Hello Email",
		text: `Welcome to task App, ${name}`
	});
}

const sendCancellationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: "dongminghui1313@gmail.com",
		subject: "See You Email",
		text: `Bye, ${name}`
	});
}
module.exports = {
	sendWelcomeEmail,
	sendCancellationEmail
}




