export type JoinTranslation = {
    identityTitle: string;
    identitySubtitle: string;
    selectName: string;
    chooseParticipant: string;
    feedbackCompleted: string;
    otherWalkIn: string;
    walkInMessage: string;
    fullName: string;
    fullNamePlaceholder: string;
    officialEmail: string;
    officialEmailPlaceholder: string;
    managerName: string;
    managerNamePlaceholder: string;
    managerEmail: string;
    managerEmailPlaceholder: string;
    
    ratingsTitle: string;
    ratingsSubtitle: string;
    preTraining: string;
    postTraining: string;
    overallTraining: string;
    contentUseful: string;
    trainerKnowledge: string;
    materialQuality: string;
    recommendTraining: string;
    yes: string;
    no: string;
    poor: string;
    excellent: string;

    commentsTitle: string;
    commentsSubtitle: string;
    topicsLearned: string;
    topicsLearnedPlaceholder: string;
    actionPlan: string;
    actionPlanPlaceholder: string;
    suggestions: string;
    suggestionsPlaceholder: string;
    submit: string;
};

export const locales: Record<string, { name: string; t: JoinTranslation }> = {
    en: {
        name: "English",
        t: {
            identityTitle: "Your Identity",
            identitySubtitle: "Please select your name from the batch",
            selectName: "Select Your Name",
            chooseParticipant: "-- Choose Participant --",
            feedbackCompleted: "(Feedback Completed)",
            otherWalkIn: "+ Other / Walk-In (Not on list)",
            walkInMessage: "You are registering as a Walk-In participant.",
            fullName: "Full Name",
            fullNamePlaceholder: "Your Full Name",
            officialEmail: "Official Email",
            officialEmailPlaceholder: "e.g. jod@thriveni.com",
            managerName: "Manager Name",
            managerNamePlaceholder: "Your Reporting Manager's Name",
            managerEmail: "Manager Email",
            managerEmailPlaceholder: "Your Reporting Manager's Official Email",
            
            ratingsTitle: "Feedback Ratings",
            ratingsSubtitle: "Please rate the following parameters",
            preTraining: "Rate your knowledge level BEFORE training",
            postTraining: "Rate your knowledge level AFTER training",
            overallTraining: "How would you rate the overall training?",
            contentUseful: "Contents covered were useful for my work",
            trainerKnowledge: "Trainer Knowledge and Delivery",
            materialQuality: "Quality of Training Materials",
            recommendTraining: "I would recommend this training to others",
            yes: "Yes",
            no: "No",
            poor: "Poor",
            excellent: "Excellent",

            commentsTitle: "Additional Comments",
            commentsSubtitle: "Your thoughts matter",
            topicsLearned: "Topics learned & Activities done",
            topicsLearnedPlaceholder: "What were the key takeaways from this session?",
            actionPlan: "Action Plan (How will you use this?)",
            actionPlanPlaceholder: "How do you plan to apply this knowledge in your daily work?",
            suggestions: "Suggestions if any",
            suggestionsPlaceholder: "Any ideas on how we can make this training better?",
            submit: "Submit Feedback",
        }
    },
    hi: {
        name: "हिंदी",
        t: {
            identityTitle: "आपकी पहचान",
            identitySubtitle: "कृपया बैच से अपना नाम चुनें",
            selectName: "अपना नाम चुनें",
            chooseParticipant: "-- प्रतिभागी चुनें --",
            feedbackCompleted: "(प्रतिक्रिया पूर्ण)",
            otherWalkIn: "+ अन्य / वॉक-इन (सूची में नहीं)",
            walkInMessage: "आप वॉक-इन प्रतिभागी के रूप में पंजीकरण कर रहे हैं।",
            fullName: "पूरा नाम",
            fullNamePlaceholder: "आपका पूरा नाम",
            officialEmail: "आधिकारिक ईमेल",
            officialEmailPlaceholder: "उदाहरण: jod@thriveni.com",
            managerName: "मैनेजर का नाम",
            managerNamePlaceholder: "आपके रिपोर्टिंग मैनेजर का नाम",
            managerEmail: "मैनेजर का ईमेल",
            managerEmailPlaceholder: "आपके रिपोर्टिंग मैनेजर का आधिकारिक ईमेल",
            
            ratingsTitle: "प्रतिक्रिया रेटिंग",
            ratingsSubtitle: "कृपया निम्नलिखित मापदंडों का मूल्यांकन करें",
            preTraining: "प्रशिक्षण से पहले अपने ज्ञान के स्तर का मूल्यांकन करें",
            postTraining: "प्रशिक्षण के बाद अपने ज्ञान के स्तर का मूल्यांकन करें",
            overallTraining: "आप समग्र प्रशिक्षण को कैसे रेट करेंगे?",
            contentUseful: "शामिल विषय मेरे काम के लिए उपयोगी थे",
            trainerKnowledge: "प्रशिक्षक का ज्ञान और वितरण",
            materialQuality: "प्रशिक्षण सामग्री की गुणवत्ता",
            recommendTraining: "मैं दूसरों को इस प्रशिक्षण की सिफारिश करूंगा",
            yes: "हाँ",
            no: "नहीं",
            poor: "खराब",
            excellent: "उत्कृष्ट",

            commentsTitle: "अतिरिक्त टिप्पणियाँ",
            commentsSubtitle: "आपके विचार महत्वपूर्ण हैं",
            topicsLearned: "सीखे गए विषय और की गई गतिविधियाँ",
            topicsLearnedPlaceholder: "इस सत्र से मुख्य बातें क्या थीं?",
            actionPlan: "कार्य योजना (आप इसका उपयोग कैसे करेंगे?)",
            actionPlanPlaceholder: "आप अपने दैनिक काम में इस ज्ञान को कैसे लागू करने की योजना बना रहे हैं?",
            suggestions: "यदि कोई सुझाव हो",
            suggestionsPlaceholder: "क्या कोई विचार है कि हम इस प्रशिक्षण को कैसे बेहतर बना सकते हैं?",
            submit: "प्रतिक्रिया सबमिट करें",
        }
    }
};
