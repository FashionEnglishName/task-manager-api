const express = require("express");
const User = require("../models/user.js");
const router = express.Router();
const auth = require("../middleware/auth.js");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, sendCancellationEmail } = require("../emails/account.js");

router.post("/users", async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch(e) {
		res.status(500).send(e);
	}

});

router.get("/users/me", auth, async (req, res) => {
	res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const updatesAllowed = ['name', 'email', 'password', 'age'];
	const isValidUpdate = updates.every(update => updatesAllowed.includes(update));

	if(!isValidUpdate) return res.status(400).send("Update invalid");

	try {
		updates.forEach(update => req.user[update] = req.body[update]);
		await req.user.save();		

		res.send(req.user);
	} catch (e) {
		res.status(500).send(e);
	}

});

router.delete("/users/me", auth, async (req, res) => {
	try {
		sendCancellationEmail(req.user.email, req.user.name);
		await req.user.remove();
		res.send(req.user);
	} catch (e) {
		console.log(e);
		res.status(500).send(e);
	}
});

router.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password);
		const token = await user.generateAuthToken();
		res.send({user, token});
	} catch (e) {
		console.log(e);
		res.status(400).send(e);
	}
});

router.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
		await req.user.save();
		res.send();
	} catch(e) {
		res.status(500).send(e);
	}
});

router.post("/users/logoutAll", auth, async (req, res) => {
	try {
		res.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send(e);
	}
});


const upload = multer({
	// dest: "avatars",
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error("Avatar must be a jpg or jpeg or png"));
		}

		cb(undefined, true);
	}
});
router.post("/users/me/avatar",auth, upload.single("upload"), async (req, res) => {
	// req.user.avatar = req.file.buffer;
	const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250 }).png().toBuffer();
	req.user.avatar = buffer;
	await req.user.save();
	res.send();
}, (error, req, res, next) => {
	res.status(400).send({Error: error.message});
})

router.delete("/users/me/avatar", async (req, res) => {
	try {
		req.user.avatar = undefined;
		console.log(req.user);
		await req.user.save();
		res.send();
	} catch(e) {
		res.status(500).send(e);
	}
});

router.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		console.log(user);

		if(!user || !user.avatar) throw new Error();

		res.set("Content-Type", "image/png");
		res.send(user.avatar);
	} catch (e) {
		console.log(e);
		res.status(404).send();
	}
})

module.exports = router;