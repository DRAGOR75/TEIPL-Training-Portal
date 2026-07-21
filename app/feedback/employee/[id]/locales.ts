export type Translation = {
    title: string;
    subtitle: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    stronglyDisagree: string;
    stronglyAgree: string;
    submit: string;
};

export const locales: Record<string, { name: string; t: Translation }> = {
    en: {
        name: "English",
        t: {
            title: "Post training (30 days) performance feedback",
            subtitle: "Please rate the impact of:",
            q1: "Q1. This program was relevant and useful for my current work.",
            q2: "Q2. I am able to apply most of the knowledge/skills at my workplace.",
            q3: "Q3. I am able to do my job better after the training.",
            q4: "Q4. The training has influenced my way of daily working.",
            q5: "Q5. The program has improved my efficiency and productivity.",
            stronglyDisagree: "Strongly Disagree",
            stronglyAgree: "Strongly Agree",
            submit: "Submit Effectiveness Rating",
        }
    },
    hi: {
        name: "हिंदी",
        t: {
            title: "प्रशिक्षण के बाद (30 दिन) प्रदर्शन प्रतिक्रिया",
            subtitle: "कृपया इसके प्रभाव का मूल्यांकन करें:",
            q1: "प्रश्न 1. यह कार्यक्रम मेरे वर्तमान कार्य के लिए प्रासंगिक और उपयोगी था।",
            q2: "प्रश्न 2. मैं कार्यस्थल पर अधिकांश ज्ञान/कौशल को लागू करने में सक्षम हूं।",
            q3: "प्रश्न 3. प्रशिक्षण के बाद मैं अपना काम बेहतर तरीके से कर पा रहा हूं।",
            q4: "प्रश्न 4. प्रशिक्षण ने मेरे दैनिक कार्य करने के तरीके को प्रभावित किया है।",
            q5: "प्रश्न 5. कार्यक्रम ने मेरी कार्यक्षमता और उत्पादकता में सुधार किया है।",
            stronglyDisagree: "पूरी तरह असहमत",
            stronglyAgree: "पूरी तरह सहमत",
            submit: "मूल्यांकन सबमिट करें",
        }
    },

};
