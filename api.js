const API_URL =
"https://script.google.com/macros/s/AKfycbxJoRpl3Zp1cPRPngwh4JuSTC_fAwVwd3R7-wdLZWm8XOWgynee4ems4vgojR0ghZA31g/exec";

async function api(action, data = {}) {
    const formData = new URLSearchParams();

    formData.append("request", JSON.stringify({
        action,
        data
    }));

    const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        redirect: "follow"
    });

    const text = await response.text();

    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch (error) {
        throw new Error("Invalid response from server.");
    }

    if (parsed && typeof parsed === "object") {
        if (Object.prototype.hasOwnProperty.call(parsed, "success")) {
            return parsed;
        }

        if (Object.prototype.hasOwnProperty.call(parsed, "data")) {
            return {
                success: true,
                message: parsed.message || "",
                data: parsed.data
            };
        }

        return {
            success: true,
            message: parsed.message || "",
            data: parsed
        };
    }

    return {
        success: true,
        data: parsed
    };
}