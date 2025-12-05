import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to translate French enum values to English
 * This allows the frontend to continue using French values while the backend uses English
 */

// Translation maps
const REGISTRATION_STATUS_FR_TO_EN: Record<string, string> = {
    'En attente': 'PENDING',
    'Frais payés': 'PAID',
    'Validée': 'VALIDATED',
    'Refusée': 'REJECTED',
    'En attente de paiement': 'PENDING', // Alias
};

const REGISTRATION_STATUS_EN_TO_FR: Record<string, string> = {
    'PENDING': 'En attente',
    'PAID': 'Frais payés',
    'VALIDATED': 'Validée',
    'REJECTED': 'Refusée',
};

const SESSION_STATUS_FR_TO_EN: Record<string, string> = {
    'À venir': 'UPCOMING',
    'En cours': 'IN_PROGRESS',
    'Terminée': 'COMPLETED',
    'Annulée': 'CANCELLED',
};

const SESSION_STATUS_EN_TO_FR: Record<string, string> = {
    'UPCOMING': 'À venir',
    'IN_PROGRESS': 'En cours',
    'COMPLETED': 'Terminée',
    'CANCELLED': 'Annulée',
};

const PAYMENT_METHOD_FR_TO_EN: Record<string, string> = {
    'Espèces': 'CASH',
    'Chèque': 'CHECK',
    'Virement bancaire': 'BANK_TRANSFER',
    'Carte bancaire': 'CARD',
    'Paiement en ligne': 'ONLINE',
};

const PAYMENT_METHOD_EN_TO_FR: Record<string, string> = {
    'CASH': 'Espèces',
    'CHECK': 'Chèque',
    'BANK_TRANSFER': 'Virement bancaire',
    'CARD': 'Carte bancaire',
    'ONLINE': 'Paiement en ligne',
};

const PAYMENT_TYPE_FR_TO_EN: Record<string, string> = {
    "Frais d'inscription": 'REGISTRATION_FEE',
    'Frais de session': 'SESSION_FEE',
};

const PAYMENT_TYPE_EN_TO_FR: Record<string, string> = {
    'REGISTRATION_FEE': "Frais d'inscription",
    'SESSION_FEE': 'Frais de session',
};

/**
 * Translate query parameters from French to English
 */
export function translateQueryParams(req: Request, res: Response, next: NextFunction) {
    try {
        // Translate status parameter
        if (req.query.status && typeof req.query.status === 'string') {
            const frenchStatus = req.query.status;
            const englishStatus =
                REGISTRATION_STATUS_FR_TO_EN[frenchStatus] ||
                SESSION_STATUS_FR_TO_EN[frenchStatus] ||
                frenchStatus; // Keep as-is if no translation found

            req.query.status = englishStatus;
        }

        // Translate paymentMethod parameter
        if (req.query.paymentMethod && typeof req.query.paymentMethod === 'string') {
            const frenchMethod = req.query.paymentMethod;
            req.query.paymentMethod = PAYMENT_METHOD_FR_TO_EN[frenchMethod] || frenchMethod;
        }

        // Translate paymentType parameter
        if (req.query.paymentType && typeof req.query.paymentType === 'string') {
            const frenchType = req.query.paymentType;
            req.query.paymentType = PAYMENT_TYPE_FR_TO_EN[frenchType] || frenchType;
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Translate request body from French to English
 */
export function translateRequestBody(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.body && typeof req.body === 'object') {
            // Translate status
            if (req.body.status && typeof req.body.status === 'string') {
                req.body.status =
                    REGISTRATION_STATUS_FR_TO_EN[req.body.status] ||
                    SESSION_STATUS_FR_TO_EN[req.body.status] ||
                    req.body.status;
            }

            // Translate paymentMethod
            if (req.body.paymentMethod && typeof req.body.paymentMethod === 'string') {
                req.body.paymentMethod = PAYMENT_METHOD_FR_TO_EN[req.body.paymentMethod] || req.body.paymentMethod;
            }

            // Translate paymentType
            if (req.body.paymentType && typeof req.body.paymentType === 'string') {
                req.body.paymentType = PAYMENT_TYPE_FR_TO_EN[req.body.paymentType] || req.body.paymentType;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Translate response data from English to French
 * This ensures the frontend receives French values
 */
export function translateResponseBody(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
        if (body && typeof body === 'object') {
            // Recursively translate all enum values in the response
            const translatedBody = translateObjectToFrench(body);
            return originalJson(translatedBody);
        }
        return originalJson(body);
    };

    next();
}

/**
 * Recursively translate object properties from English to French
 */
function translateObjectToFrench(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => translateObjectToFrench(item));
    }

    if (obj && typeof obj === 'object') {
        const translated: any = {};
        for (const key in obj) {
            const value = obj[key];

            // Translate specific fields
            if (key === 'status' && typeof value === 'string') {
                translated[key] =
                    REGISTRATION_STATUS_EN_TO_FR[value] ||
                    SESSION_STATUS_EN_TO_FR[value] ||
                    value;
            } else if (key === 'paymentMethod' && typeof value === 'string') {
                translated[key] = PAYMENT_METHOD_EN_TO_FR[value] || value;
            } else if (key === 'paymentType' && typeof value === 'string') {
                translated[key] = PAYMENT_TYPE_EN_TO_FR[value] || value;
            } else if (typeof value === 'object') {
                translated[key] = translateObjectToFrench(value);
            } else {
                translated[key] = value;
            }
        }
        return translated;
    }

    return obj;
}
