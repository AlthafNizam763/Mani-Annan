"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const firebase_1 = require("../firebase");
const contracts_1 = require("@project-echo/contracts");
exports.meRouter = (0, express_1.Router)();
// GET /api/v1/me
exports.meRouter.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const userDocRef = firebase_1.db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            const initialProfile = {
                uid,
                email: req.user.email || '',
                createdAt: new Date().toISOString(),
                styleProfile: {
                    version: 1,
                    primaryLanguages: ['en'],
                    usesManglish: true,
                    commonSlang: ['lah', 'bro', 'machan'],
                    avgSentenceLength: 'short',
                    punctuationHabits: {
                        multipleExclamations: false,
                        usesEllipsis: true,
                        omitsEndingPeriod: true,
                        questionMarksOnlyWhenNeeded: true
                    },
                    emojiHabits: {
                        frequentEmojis: ['👍', '🔥', '😂'],
                        emojiFrequency: 'moderate'
                    },
                    greetingStyle: 'informal',
                    closingStyle: 'casual',
                    updatedAt: new Date().toISOString()
                }
            };
            await userDocRef.set(initialProfile);
            res.json(initialProfile);
            return;
        }
        res.json(userDoc.data());
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/me/style
exports.meRouter.put('/style', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const validatedStyle = contracts_1.StyleProfileSchema.parse(req.body);
        const userDocRef = firebase_1.db.collection('users').doc(uid);
        await userDocRef.set({
            styleProfile: {
                ...validatedStyle,
                updatedAt: new Date().toISOString()
            }
        }, { merge: true });
        res.json({
            success: true,
            message: 'Style profile updated successfully',
            styleProfile: validatedStyle
        });
    }
    catch (err) {
        next(err);
    }
});
