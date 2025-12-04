/**
 * Company settings database operations
 */
import { neon } from '@neondatabase/serverless';

export interface CompanySettings {
    id: number;
    company_name: string;
    company_phone: string;
    company_fax?: string;
    company_address?: string;
    company_email?: string;
    tax_id?: string;
    quote_validity_days: number;
    payment_terms?: string;
    quote_notes?: string;
    updated_at: string;
}

const DEFAULT_SETTINGS: Omit<CompanySettings, 'id' | 'updated_at'> = {
    company_name: '',
    company_phone: '',
    company_fax: '',
    company_address: '',
    company_email: '',
    tax_id: '',
    quote_validity_days: 15,
    payment_terms: '簽約金 30%，進場 30%，完工驗收 40%',
    quote_notes: '本報價單經簽認後即視為正式合約的一部分。'
};

/**
 * Get company settings
 */
export async function getCompanySettings(databaseUrl: string): Promise<CompanySettings> {
    const sql = neon(databaseUrl);

    const result = await sql`
        SELECT * FROM company_settings WHERE id = 1
    `;

    if (result.length === 0) {
        // Return default settings if not found
        return {
            id: 1,
            ...DEFAULT_SETTINGS,
            updated_at: new Date().toISOString()
        };
    }

    return result[0] as CompanySettings;
}

/**
 * Update company settings
 */
export async function updateCompanySettings(
    settings: Partial<Omit<CompanySettings, 'id' | 'updated_at'>>,
    databaseUrl: string
): Promise<CompanySettings> {
    const sql = neon(databaseUrl);

    // Check if settings exist
    const existing = await sql`SELECT id FROM company_settings WHERE id = 1`;

    if (existing.length === 0) {
        // Insert new settings
        const result = await sql`
            INSERT INTO company_settings (
                id, company_name, company_phone, company_fax, company_address,
                company_email, tax_id, quote_validity_days, payment_terms, quote_notes, updated_at
            ) VALUES (
                1,
                ${settings.company_name || DEFAULT_SETTINGS.company_name},
                ${settings.company_phone || DEFAULT_SETTINGS.company_phone},
                ${settings.company_fax || DEFAULT_SETTINGS.company_fax},
                ${settings.company_address || DEFAULT_SETTINGS.company_address},
                ${settings.company_email || DEFAULT_SETTINGS.company_email},
                ${settings.tax_id || DEFAULT_SETTINGS.tax_id},
                ${settings.quote_validity_days || DEFAULT_SETTINGS.quote_validity_days},
                ${settings.payment_terms || DEFAULT_SETTINGS.payment_terms},
                ${settings.quote_notes || DEFAULT_SETTINGS.quote_notes},
                NOW()
            )
            RETURNING *
        `;
        return result[0] as CompanySettings;
    } else {
        // Update existing settings
        const result = await sql`
            UPDATE company_settings SET
                company_name = COALESCE(${settings.company_name}, company_name),
                company_phone = COALESCE(${settings.company_phone}, company_phone),
                company_fax = COALESCE(${settings.company_fax}, company_fax),
                company_address = COALESCE(${settings.company_address}, company_address),
                company_email = COALESCE(${settings.company_email}, company_email),
                tax_id = COALESCE(${settings.tax_id}, tax_id),
                quote_validity_days = COALESCE(${settings.quote_validity_days}, quote_validity_days),
                payment_terms = COALESCE(${settings.payment_terms}, payment_terms),
                quote_notes = COALESCE(${settings.quote_notes}, quote_notes),
                updated_at = NOW()
            WHERE id = 1
            RETURNING *
        `;
        return result[0] as CompanySettings;
    }
}
