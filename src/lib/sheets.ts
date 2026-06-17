import { LeadSubmission } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, limit, query, orderBy } from 'firebase/firestore';

const CONFIG_DOC_PATH = 'config/sheets';

interface SheetsConfig {
  spreadsheetId: string;
  accessToken: string;
  updatedAt: string;
  webAppUrl?: string;
}

// 1. Fetch Sheets mapping config from Firestore (spreadsheet ID & auth token)
export const getSheetsConfig = async (): Promise<SheetsConfig | null> => {
  const defaultSpreadsheetId = '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko';
  
  // Safe fallback to localStorage for immediate retrieval or offline capability
  try {
    const cached = localStorage.getItem('chakachak_sheets_config');
    if (cached) {
      const parsed = JSON.parse(cached) as SheetsConfig;
      if (!parsed.spreadsheetId) {
        parsed.spreadsheetId = defaultSpreadsheetId;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading sheets config from localStorage:', e);
  }

  try {
    const configSnap = await getDoc(doc(db, CONFIG_DOC_PATH));
    if (configSnap.exists()) {
      const data = configSnap.data() as SheetsConfig;
      if (!data.spreadsheetId) {
        data.spreadsheetId = defaultSpreadsheetId;
      }
      try {
        localStorage.setItem('chakachak_sheets_config', JSON.stringify(data));
      } catch (innerErr) {}
      return data;
    }
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('offline') || msg.includes('network') || msg.includes('Failed to get document')) {
      console.warn('Firestore is offline or unreachable. Reading from cache if possible.', msg);
    } else {
      console.error('Error reading sheets config path from Firestore:', error);
    }
  }

  // Return a default config pointing to client's requested spreadsheet
  return {
    spreadsheetId: defaultSpreadsheetId,
    accessToken: '',
    updatedAt: new Date().toISOString()
  };
};

// 2. Save active Sheets mapping config to Firestore
export const saveSheetsConfig = async (spreadsheetId: string, accessToken: string) => {
  const existing = await getSheetsConfig();
  const config: SheetsConfig = {
    spreadsheetId: spreadsheetId || '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko',
    accessToken,
    updatedAt: new Date().toISOString(),
    webAppUrl: existing?.webAppUrl,
  };

  try {
    localStorage.setItem('chakachak_sheets_config', JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving sheets config to localStorage:', e);
  }

  try {
    await setDoc(doc(db, CONFIG_DOC_PATH), config);
  } catch (error) {
    console.error('Failed to save sheets config to Firestore (saving locally instead):', error);
  }
};

// 2b. Save full config update
export const saveFullSheetsConfig = async (configData: Partial<SheetsConfig>) => {
  const existing = await getSheetsConfig() || {
    spreadsheetId: '1-QfPQtzN-y-aHy6TwfGAfTR4HxHOXy_gF6Bn934B3ko',
    accessToken: '',
    updatedAt: new Date().toISOString()
  };
  
  const updated: SheetsConfig = {
    ...existing,
    ...configData,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem('chakachak_sheets_config', JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving sheets config to localStorage:', e);
  }

  try {
    await setDoc(doc(db, CONFIG_DOC_PATH), updated);
  } catch (error) {
    console.error('Failed to save sheets config to Firestore:', error);
  }
};

// 3. Create a brand-new Spreadsheet under the admin's Google account
export const createNewSpreadsheet = async (accessToken: string): Promise<string> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      properties: {
        title: 'ChakaChak Launch Registrations',
      },
      sheets: [
        {
          properties: {
            title: 'Registrations',
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize spreadsheet header columns
  const headerRow = [
    'ID',
    'Name',
    'Mobile',
    'WhatsApp',
    'City',
    'Society Name',
    'Apt Units Size',
    'Vehicle Type',
    'Plan Selected',
    'Discount Amount',
    'Final Price',
    'Referral Code',
    'Created At',
    'Queue Number',
  ];

  await appendRowToSheets(spreadsheetId, accessToken, headerRow, 'Registrations');

  return spreadsheetId;
};

// 4. Append a raw row of values to Google Sheets
export const appendRowToSheets = async (
  spreadsheetId: string,
  accessToken: string,
  rowValues: any[],
  sheetTitle: string = 'Registrations'
) => {
  const range = `${sheetTitle}!A1`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('Error appending row to Google Sheets:', errText);
    throw new Error(`Failed to save to spreadsheet: ${errText}`);
  }
};

// 4b. Append a raw row of values to Google Apps Script Web App
export const appendRowViaAppsScript = async (
  webAppUrl: string,
  rowValues: any[]
): Promise<void> => {
  const response = await fetch(webAppUrl, {
    method: 'POST',
    mode: 'no-cors', // allows cross-origin requests to Apps Script
    headers: {
      'Content-Type': 'plain/text', // Avoid preflight OPTIONS request
    },
    body: JSON.stringify({ values: rowValues }),
  });
  // Since we use no-cors, we can't read the response body but we can assume it succeeded if it didn't throw an error.
};

// 5. Parse simple CSV text safely
export const parseCSV = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currRow: string[] = [];
  let currToken = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currToken += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currRow.push(currToken.trim());
      currToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      currRow.push(currToken.trim());
      if (currRow.length > 0 && (currRow.length > 1 || currRow[0] !== '')) {
        rows.push(currRow);
      }
      currRow = [];
      currToken = '';
      if (char === '\r' && nextChar === '\n') {
        i++; // skip next line break
      }
    } else {
      currToken += char;
    }
  }

  if (currToken || currRow.length > 0) {
    currRow.push(currToken.trim());
    rows.push(currRow);
  }

  return rows;
};

// 6. Fetch all unique society names directly from Google Sheets
export const getUniqueSocietiesFromSheets = async (
  spreadsheetId: string,
  accessToken?: string
): Promise<string[]> => {
  const uniqueSocieties = new Set<string>();

  // Tier 1: Try reading via Authorized Google Sheets v4 API
  if (accessToken) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Registrations!F2:F1000`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.values && Array.isArray(data.values)) {
          data.values.forEach((row: any) => {
            if (row && row[0]) {
              const socName = String(row[0]).trim();
              if (socName) {
                uniqueSocieties.add(socName);
              }
            }
          });
          return Array.from(uniqueSocieties);
        }
      }
    } catch (e) {
      console.warn('Google sheets authorized fetch failed, attempting public fallback:', e);
    }
  }

  // Tier 2: Public Google Sheets CSV Export fallback
  try {
    const publicUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
    const response = await fetch(publicUrl);
    if (response.ok) {
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      // Skip sheet header row (row index 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[5]) { // Column 6 (Society Name) is index 5
          const socName = row[5].trim();
          if (socName && socName !== 'Society Name') {
            uniqueSocieties.add(socName);
          }
        }
      }
      if (uniqueSocieties.size > 0) {
        return Array.from(uniqueSocieties);
      }
    }
  } catch (e) {
    console.warn('Google Sheets public CSV export failed, falling back to local database:', e);
  }

  return [];
};
