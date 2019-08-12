const express = require("express");
const Task = require("../models/task.js");
const auth = require("../middleware/auth.js");
const sharp = require("sharp");
const router = express.Router();

router.post("/task", auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id
	})

	try {
		await task.save();
		res.status(201).send(task);
	} catch (e) {
		res.status(400).send(e);
	}
	
});


router.get("/task", auth, async (req, res) => {
	const match = {};
	const sort = {};
 
	if(req.query.sortBy) {
		const [field, order] = req.query.sortBy.split("_");
		sort[field] = order === 'asc' ? 1 : -1;
	}

	if(req.query.completed) {
		match.completed = req.query.completed === 'true';
	}

	try {
		await req.user.populate({
			path: 'tasks',
			match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort
			}
		}).execPopulate();
		res.send(req.user.tasks);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.get("/task/:id", auth, async (req, res) => {
	const _id = req.params.id;

	try {
		const task = await Task.findOne({_id, owner: req.user._id});

		if(!task) return res.status(404).send();

		res.send(task);
	} catch (e) {
		console.log(e);
		res.status(500).send(e);
	}
});

router.patch("/task/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const updatesAllowed = ['description', 'completed'];
	const isValidUpdate = updates.every(update => updatesAllowed.includes(update));

	if(!isValidUpdate) return res.status(400).send("Bad update");

	try {
		const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
		if(!task) return res.status(404).send();

		updates.forEach(update => task[update] = req.body[update]);
		await task.save();
		res.send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.delete("/task/:id", auth, async (req, res) => {
	try {
		const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
		if(!task) return res.status(404).send();

		await task.remove();
		res.send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

module.exports = router;