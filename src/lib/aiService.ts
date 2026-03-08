import { supabase } from './supabase';

export async function getGeminiKey() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single();

    if (error || !data) return null;
    return data.gemini_api_key;
}

export async function callGemini(prompt: string) {
    const apiKey = await getGeminiKey();
    if (!apiKey) {
        throw new Error('Gemini API Key not found. Please add it in Settings -> Security Vault.');
    }

    // Gemini 2.5 Flash (using the latest stable/available endpoint pattern)
    // Note: Gemini 2.5 Flash might use a specific version tag like v1beta or similar
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    try {
        const response = await fetch(`${baseUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to call Gemini API');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}
