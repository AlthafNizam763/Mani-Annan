"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const firebase_1 = require("../firebase");
const contracts_1 = require("@project-echo/contracts");
exports.contactsRouter = (0, express_1.Router)();
// GET /api/v1/contacts
exports.contactsRouter.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const snapshot = await firebase_1.db.collection('users').doc(uid).collection('contacts').orderBy('createdAt', 'desc').get();
        const contacts = snapshot.docs.map(doc => doc.data());
        res.json(contacts);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/contacts
exports.contactsRouter.post('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const body = contracts_1.CreateContactRequestSchema.parse(req.body);
        const contactRef = firebase_1.db.collection('users').doc(uid).collection('contacts').doc();
        const newContact = {
            ...body,
            id: contactRef.id,
            autoSendEnabled: false, // MANDATORY DEFAULT FALSE
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await contactRef.set(newContact);
        res.status(201).json(newContact);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/contacts/:contactId
exports.contactsRouter.patch('/:contactId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { contactId } = req.params;
        const updates = contracts_1.UpdateContactRequestSchema.parse(req.body);
        const contactRef = firebase_1.db.collection('users').doc(uid).collection('contacts').doc(contactId);
        const existing = await contactRef.get();
        if (!existing.exists) {
            res.status(404).json({ error: 'NotFound', message: 'Contact not found' });
            return;
        }
        const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await contactRef.update(updatedData);
        res.json({ id: contactId, ...existing.data(), ...updatedData });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/contacts/:contactId
exports.contactsRouter.delete('/:contactId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { contactId } = req.params;
        const contactRef = firebase_1.db.collection('users').doc(uid).collection('contacts').doc(contactId);
        const existing = await contactRef.get();
        if (!existing.exists) {
            res.status(404).json({ error: 'NotFound', message: 'Contact not found' });
            return;
        }
        await contactRef.delete();
        res.json({ success: true, message: `Contact ${contactId} deleted successfully` });
    }
    catch (err) {
        next(err);
    }
});
