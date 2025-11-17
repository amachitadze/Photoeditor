/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Removes the background from an image using generative AI.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the image with the background removed.
 */
export const removeImageBackground = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting background removal.`);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perfectly and completely remove the background from the provided image.
- Identify the main subject(s) and isolate them.
- Make the background fully transparent.
- The edges of the subject(s) must be clean and precise.
- The output MUST be a PNG with a transparent background.

Output: Return ONLY the final image with the background removed. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and background removal prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for background removal.', response);
    
    return handleApiResponse(response, 'background removal');
};

/**
 * Creates a professional profile picture with user-defined shape and background.
 * @param originalImage The original image file.
 * @param shape The desired shape ('square' or 'circle').
 * @param backgroundStyle The desired background style ('blur', 'studio gray', 'gradient').
 * @returns A promise that resolves to the data URL of the created profile picture.
 */
export const createProfilePicture = async (
    originalImage: File,
    shape: 'square' | 'circle',
    backgroundStyle: 'blur' | 'studio' | 'gradient'
): Promise<string> => {
    console.log(`Starting profile picture creation with shape: ${shape}, background: ${backgroundStyle}.`);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const backgroundPrompts = {
        blur: 'a subtle, realistic depth-of-field blur, keeping the subject in sharp focus.',
        studio: 'a clean, professional, solid light-gray studio backdrop.',
        gradient: 'a vibrant but tasteful background gradient using complementary colors that match the subject.'
    };
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert AI photo editor specializing in creating professional profile pictures. Your task is to transform the provided image based on the following specifications.

**Specifications:**

1.  **Subject Enhancement:**
    *   Identify the main person or subject.
    *   Subtly improve the lighting, color balance, and sharpness on the subject to make them look their best. The enhancement should be natural and not over-processed.

2.  **Background Replacement:**
    *   Perfectly isolate the main subject from the original background.
    *   Replace the original background with a new one matching this description: "${backgroundPrompts[backgroundStyle]}".

3.  **Final Framing:**
    *   The final image output must be a 1:1 square aspect ratio.
    *   Center the subject's face within the square frame.
    *   If the requested shape is a **circle**: Make the area outside of a central, perfectly circular frame (containing the subject) fully transparent. The output must be a PNG file with transparency.
    *   If the requested shape is a **square**: The entire square image should be filled with the subject and the new background.

**Output Instructions:**
*   You MUST return ONLY the final edited image in PNG format.
*   Do not add any text, watermarks, or other artifacts.`;
    const textPart = { text: prompt };

    console.log('Sending image and profile picture prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for profile picture creation.', response);
    
    return handleApiResponse(response, 'profile picture creation');
};

/**
 * Removes a specified object from an image using a mask.
 * @param originalImage The original image file.
 * @param maskImage The black and white mask file where white indicates the area to remove.
 * @returns A promise that resolves to the data URL of the image with the object removed.
 */
export const removeObjectFromImage = async (
    originalImage: File,
    maskImage: File,
): Promise<string> => {
    console.log(`Starting object removal.`);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const maskImagePart = await fileToPart(maskImage);

    const prompt = `You are an expert photo editor AI. Your task is to remove an object from the first image provided. The second image is a black and white mask. The white area in the mask indicates the object(s) to be completely removed.

Instructions:
1.  Identify the object(s) indicated by the white areas in the mask image.
2.  Remove the identified object(s) from the original image.
3.  Inpaint the removed area by intelligently filling it with a realistic background that seamlessly blends with the surrounding pixels. The result should look natural and as if the object was never there.
4.  The rest of the image (the black area in the mask) must remain completely unchanged.

Output: Return ONLY the final edited image. Do not return any text.`;
    const textPart = { text: prompt };

    console.log('Sending image, mask, and object removal prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, maskImagePart, textPart] },
    });
    console.log('Received response from model for object removal.', response);
    
    return handleApiResponse(response, 'object removal');
};

/**
 * Enhances the overall quality of an image, upscaling and color correcting it.
 * @param originalImage The original image file.
 * @returns A promise that resolves to the data URL of the enhanced image.
 */
export const enhanceImageQuality = async (
    originalImage: File,
): Promise<string> => {
    console.log(`Starting AI image quality enhancement.`);
    // FIX: Use process.env.API_KEY as per coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo restoration and enhancement AI. Your task is to dramatically improve the quality of the provided image.

Instructions:
1.  **Upscale Resolution:** Intelligently increase the image's resolution and pixel count, adding plausible details where necessary.
2.  **Enhance Sharpness:** Sharpen the image to make details crisp and clear, but avoid over-sharpening artifacts.
3.  **Color Correction:** Perfectly correct the colors and lighting. Adjust white balance, contrast, and saturation to be natural, vibrant, and appealing.
4.  **Noise Reduction:** Remove any digital noise, compression artifacts, or film grain for a clean, polished look.
5.  **Final Output:** Return ONLY the final, high-quality, enhanced image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and enhancement prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for quality enhancement.', response);
    
    return handleApiResponse(response, 'quality enhancement');
};