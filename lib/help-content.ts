import { type Locale } from "@/i18n/routing";

export type HelpArticle = {
  answer: string;
  details: string[];
  keywords: string[];
  metaDescription: string;
  related: string[];
  slug: string;
  steps?: string[];
  title: string;
};

type HelpContent = {
  description: string;
  eyebrow: string;
  title: string;
  articles: HelpArticle[];
};

export const helpContent: Record<Locale, HelpContent> = {
  en: {
    eyebrow: "Help center",
    title: "LineME questions and answers",
    description:
      "Short answers about creating, joining, and managing digital queues with LineME.",
    articles: [
      {
        slug: "what-is-lineme",
        title: "What is LineME?",
        metaDescription:
          "LineME is a web-based queue management app that lets businesses create digital waiting lines and lets visitors join from their phone.",
        answer:
          "LineME is a web-based queue management app for creating and joining digital waiting lines. A business creates a line, shares a link or code, and visitors join from their phone so they can track their position without standing in a physical queue.",
        details: [
          "LineME is useful for clinics, salons, restaurants, service counters, events, and local teams that serve people in order.",
          "Visitors do not need to install an app. They can open a shared link or enter a queue code in their browser."
        ],
        keywords: ["virtual queue", "digital queue", "queue management app"],
        related: [
          "how-to-create-a-virtual-queue",
          "how-to-join-a-line",
          "how-does-a-virtual-queue-work"
        ]
      },
      {
        slug: "how-does-a-virtual-queue-work",
        title: "How does a virtual queue work?",
        metaDescription:
          "A virtual queue lets visitors join a waiting line online, track their live position, and arrive when their turn is close.",
        answer:
          "A virtual queue works by moving the waiting line online. The organizer creates a digital line, visitors join with a link or code, and everyone can see progress in real time as members are called, served, or removed.",
        details: [
          "The business can keep serving people in order while reducing crowding at the physical location.",
          "Visitors can wait nearby, at home, or anywhere convenient until their turn gets closer."
        ],
        keywords: ["how virtual queue works", "online queue", "live queue position"],
        related: [
          "what-is-lineme",
          "how-to-create-a-virtual-queue",
          "how-to-manage-a-queue-online"
        ]
      },
      {
        slug: "how-to-create-a-virtual-queue",
        title: "How do I create a virtual queue?",
        metaDescription:
          "Create a virtual queue in LineME by signing in, setting up a line, choosing queue options, and sharing the join link or code.",
        answer:
          "To create a virtual queue in LineME, sign in, choose Create queue, enter the line details, set options such as capacity or service estimates if needed, and share the join link or code with visitors.",
        details: [
          "Create a clear line name for your own management screen, then choose the settings that match how your team serves people.",
          "After the queue is created, LineME gives you a join method you can share at a desk, on a screen, in a message, or as a QR code."
        ],
        steps: [
          "Sign in to LineME.",
          "Open Create queue.",
          "Add the queue details and any visitor questions you need.",
          "Choose optional controls such as capacity, service estimates, auto notify, or pause support.",
          "Create the queue and share the join link, code, or QR code."
        ],
        keywords: ["create virtual queue", "create digital queue", "queue setup"],
        related: [
          "how-to-manage-a-queue-online",
          "how-can-customers-join-a-queue-by-qr-code",
          "what-is-lineme"
        ]
      },
      {
        slug: "how-to-join-a-line",
        title: "How do I join a line online?",
        metaDescription:
          "Join a LineME queue by opening the shared link, scanning the QR code, or entering the queue code from your phone.",
        answer:
          "To join a line online with LineME, open the shared link, scan the QR code, or enter the queue code. After joining, you can see your live position and follow the queue from your phone.",
        details: [
          "You can join from a normal web browser, so you do not need to download a separate app.",
          "Some queues may ask for extra information so the organizer can serve you correctly."
        ],
        steps: [
          "Open the LineME join page or scan the queue QR code.",
          "Enter the queue code if it is not already filled in.",
          "Submit any requested details.",
          "Keep the ticket page open to watch your live position."
        ],
        keywords: ["join queue online", "join line by code", "queue ticket"],
        related: [
          "how-can-customers-join-a-queue-by-qr-code",
          "how-will-i-know-when-my-turn-is-close",
          "what-is-lineme"
        ]
      },
      {
        slug: "how-can-customers-join-a-queue-by-qr-code",
        title: "How can customers join a queue by QR code?",
        metaDescription:
          "Customers can join a LineME queue by scanning the QR code, opening the join page, and submitting the requested details.",
        answer:
          "Customers can join a LineME queue by scanning the queue QR code with their phone. The QR code opens the join page, where the customer confirms the line and submits any required details before receiving a live ticket.",
        details: [
          "QR codes are useful at reception desks, storefronts, counters, events, and waiting areas.",
          "A QR code reduces typing mistakes because the visitor does not need to manually enter the queue code."
        ],
        keywords: ["queue QR code", "join queue by QR", "scan queue code"],
        related: [
          "how-to-join-a-line",
          "how-to-create-a-virtual-queue",
          "how-will-i-know-when-my-turn-is-close"
        ]
      },
      {
        slug: "how-to-manage-a-queue-online",
        title: "How do I manage a queue online?",
        metaDescription:
          "Manage a LineME queue online by calling members, marking people served, pausing intake, and tracking the waiting line in real time.",
        answer:
          "To manage a queue online in LineME, open your management screen, watch the live list, call the next member when ready, mark members served after service, and pause or close the line when you need to control intake.",
        details: [
          "The management screen helps creators keep the queue moving without depending on a paper list.",
          "You can request extra information from a visitor when more details are needed before service."
        ],
        steps: [
          "Open Manage queues after signing in.",
          "Choose the active line you want to run.",
          "Call the next waiting member when your team is ready.",
          "Mark the member served after service is complete.",
          "Pause, resume, or close the line when your availability changes."
        ],
        keywords: ["manage queue online", "queue management", "call next customer"],
        related: [
          "how-to-create-a-virtual-queue",
          "how-does-a-virtual-queue-work",
          "what-is-lineme"
        ]
      },
      {
        slug: "how-will-i-know-when-my-turn-is-close",
        title: "How will I know when my turn is close?",
        metaDescription:
          "LineME shows your live queue position from your phone so you can know when your turn is getting close.",
        answer:
          "In LineME, you know your turn is close by checking your live ticket page. It shows your current position in the queue and updates as the organizer calls or serves people ahead of you.",
        details: [
          "When notifications are available and enabled, the queue can also send turn updates.",
          "The safest option is to keep your ticket page accessible until your visit is complete."
        ],
        keywords: ["queue position", "turn updates", "live queue status"],
        related: [
          "how-to-join-a-line",
          "how-can-customers-join-a-queue-by-qr-code",
          "how-does-a-virtual-queue-work"
        ]
      }
    ]
  },
  hi: {
    eyebrow: "सहायता केंद्र",
    title: "LineME सवाल और जवाब",
    description:
      "LineME में डिजिटल कतार बनाने, जुड़ने और प्रबंधित करने के छोटे जवाब।",
    articles: [
      {
        slug: "what-is-lineme",
        title: "LineME क्या है?",
        metaDescription:
          "LineME एक वेब-आधारित कतार प्रबंधन ऐप है जिससे व्यवसाय डिजिटल प्रतीक्षा कतार बनाते हैं और विजिटर फोन से जुड़ते हैं।",
        answer:
          "LineME डिजिटल प्रतीक्षा कतार बनाने और उनमें जुड़ने के लिए वेब-आधारित कतार प्रबंधन ऐप है। व्यवसाय एक कतार बनाकर लिंक या कोड साझा करता है, और विजिटर फोन से जुड़कर अपनी स्थिति देख सकते हैं।",
        details: [
          "LineME क्लिनिक, सैलून, रेस्तरां, सर्विस काउंटर, इवेंट और क्रम से सेवा देने वाली स्थानीय टीमों के लिए उपयोगी है।",
          "विजिटर को ऐप इंस्टॉल करने की जरूरत नहीं होती। वे लिंक खोलकर या कतार कोड डालकर ब्राउज़र से जुड़ सकते हैं।"
        ],
        keywords: ["डिजिटल कतार", "वर्चुअल कतार", "कतार प्रबंधन ऐप"],
        related: [
          "how-to-create-a-virtual-queue",
          "how-to-join-a-line",
          "how-does-a-virtual-queue-work"
        ]
      },
      {
        slug: "how-does-a-virtual-queue-work",
        title: "वर्चुअल कतार कैसे काम करती है?",
        metaDescription:
          "वर्चुअल कतार विजिटर को ऑनलाइन जुड़ने, लाइव स्थिति देखने और बारी पास आने पर पहुंचने में मदद करती है।",
        answer:
          "वर्चुअल कतार प्रतीक्षा लाइन को ऑनलाइन ले आती है। आयोजक डिजिटल कतार बनाता है, विजिटर लिंक या कोड से जुड़ते हैं, और सदस्य बुलाए या सर्व किए जाने पर सभी प्रगति रीयल टाइम में देख सकते हैं।",
        details: [
          "व्यवसाय लोगों को क्रम से सेवा दे सकता है और स्थान पर भीड़ कम कर सकता है।",
          "विजिटर अपनी बारी पास आने तक पास में, घर पर या किसी सुविधाजनक जगह पर प्रतीक्षा कर सकते हैं।"
        ],
        keywords: ["वर्चुअल कतार कैसे काम करती है", "ऑनलाइन कतार", "लाइव कतार स्थिति"],
        related: [
          "what-is-lineme",
          "how-to-create-a-virtual-queue",
          "how-to-manage-a-queue-online"
        ]
      },
      {
        slug: "how-to-create-a-virtual-queue",
        title: "मैं वर्चुअल कतार कैसे बनाऊं?",
        metaDescription:
          "LineME में साइन इन करके, कतार विवरण जोड़कर और लिंक या कोड साझा करके वर्चुअल कतार बनाएं।",
        answer:
          "LineME में वर्चुअल कतार बनाने के लिए साइन इन करें, Create queue चुनें, कतार विवरण डालें, जरूरत हो तो क्षमता या सेवा अनुमान जैसे विकल्प सेट करें, और विजिटर के साथ लिंक या कोड साझा करें।",
        details: [
          "अपनी मैनेजमेंट स्क्रीन के लिए स्पष्ट कतार नाम रखें, फिर अपनी सेवा के तरीके के अनुसार सेटिंग चुनें।",
          "कतार बनने के बाद LineME आपको लिंक, कोड या QR कोड देता है जिसे आप डेस्क, स्क्रीन या संदेश में साझा कर सकते हैं।"
        ],
        steps: [
          "LineME में साइन इन करें।",
          "Create queue खोलें।",
          "कतार विवरण और जरूरी विजिटर सवाल जोड़ें।",
          "क्षमता, सेवा अनुमान, ऑटो नोटिफाई या pause जैसे वैकल्पिक नियंत्रण चुनें।",
          "कतार बनाएं और लिंक, कोड या QR कोड साझा करें।"
        ],
        keywords: ["वर्चुअल कतार बनाएं", "डिजिटल कतार बनाएं", "कतार सेटअप"],
        related: [
          "how-to-manage-a-queue-online",
          "how-can-customers-join-a-queue-by-qr-code",
          "what-is-lineme"
        ]
      },
      {
        slug: "how-to-join-a-line",
        title: "मैं ऑनलाइन कतार में कैसे जुड़ूं?",
        metaDescription:
          "LineME कतार में साझा लिंक खोलकर, QR कोड स्कैन करके या कतार कोड डालकर फोन से जुड़ें।",
        answer:
          "LineME में ऑनलाइन कतार से जुड़ने के लिए साझा लिंक खोलें, QR कोड स्कैन करें या कतार कोड डालें। जुड़ने के बाद आप अपनी लाइव स्थिति फोन से देख सकते हैं।",
        details: [
          "आप सामान्य वेब ब्राउज़र से जुड़ सकते हैं, इसलिए अलग ऐप डाउनलोड करने की जरूरत नहीं है।",
          "कुछ कतारें सेवा सही ढंग से देने के लिए अतिरिक्त जानकारी मांग सकती हैं।"
        ],
        steps: [
          "LineME join page खोलें या कतार QR कोड स्कैन करें।",
          "अगर कोड पहले से भरा नहीं है, तो कतार कोड डालें।",
          "मांगी गई जानकारी सबमिट करें।",
          "अपनी लाइव स्थिति देखने के लिए टिकट पेज खुला रखें।"
        ],
        keywords: ["ऑनलाइन कतार में जुड़ें", "कोड से कतार में जुड़ें", "कतार टिकट"],
        related: [
          "how-can-customers-join-a-queue-by-qr-code",
          "how-will-i-know-when-my-turn-is-close",
          "what-is-lineme"
        ]
      },
      {
        slug: "how-can-customers-join-a-queue-by-qr-code",
        title: "ग्राहक QR कोड से कतार में कैसे जुड़ सकते हैं?",
        metaDescription:
          "ग्राहक LineME QR कोड स्कैन करके join page खोलते हैं और जरूरी जानकारी देकर लाइव टिकट पा सकते हैं।",
        answer:
          "ग्राहक फोन से कतार QR कोड स्कैन करके LineME कतार में जुड़ सकते हैं। QR कोड join page खोलता है, जहां ग्राहक कतार की पुष्टि करके जरूरी जानकारी सबमिट करते हैं और लाइव टिकट पाते हैं।",
        details: [
          "QR कोड रिसेप्शन डेस्क, दुकान, काउंटर, इवेंट और प्रतीक्षा क्षेत्र में उपयोगी होते हैं।",
          "QR कोड टाइपिंग गलती कम करता है क्योंकि विजिटर को कतार कोड हाथ से डालना नहीं पड़ता।"
        ],
        keywords: ["कतार QR कोड", "QR से कतार में जुड़ें", "कतार कोड स्कैन"],
        related: [
          "how-to-join-a-line",
          "how-to-create-a-virtual-queue",
          "how-will-i-know-when-my-turn-is-close"
        ]
      },
      {
        slug: "how-to-manage-a-queue-online",
        title: "मैं ऑनलाइन कतार कैसे प्रबंधित करूं?",
        metaDescription:
          "LineME में लाइव सूची देखकर, सदस्यों को बुलाकर, served मार्क करके और intake pause करके कतार प्रबंधित करें।",
        answer:
          "LineME में ऑनलाइन कतार प्रबंधित करने के लिए management screen खोलें, लाइव सूची देखें, तैयार होने पर अगले सदस्य को बुलाएं, सेवा के बाद served मार्क करें, और जरूरत पड़ने पर कतार pause या close करें।",
        details: [
          "मैनेजमेंट स्क्रीन पेपर सूची पर निर्भर हुए बिना कतार को आगे बढ़ाने में मदद करती है।",
          "सेवा से पहले ज्यादा जानकारी चाहिए तो आप विजिटर से अतिरिक्त जानकारी भी मांग सकते हैं।"
        ],
        steps: [
          "साइन इन करने के बाद Manage queues खोलें।",
          "जिस active line को चलाना है उसे चुनें।",
          "टीम तैयार होने पर अगले waiting member को call करें।",
          "सेवा पूरी होने पर member को served मार्क करें।",
          "उपलब्धता बदलने पर line pause, resume या close करें।"
        ],
        keywords: ["ऑनलाइन कतार प्रबंधन", "कतार प्रबंधन", "अगले ग्राहक को बुलाएं"],
        related: [
          "how-to-create-a-virtual-queue",
          "how-does-a-virtual-queue-work",
          "what-is-lineme"
        ]
      },
      {
        slug: "how-will-i-know-when-my-turn-is-close",
        title: "मुझे कैसे पता चलेगा कि मेरी बारी पास है?",
        metaDescription:
          "LineME आपके फोन पर लाइव कतार स्थिति दिखाता है ताकि आपको पता रहे कि आपकी बारी कब पास आ रही है।",
        answer:
          "LineME में आपकी बारी पास है या नहीं, यह आप अपने लाइव टिकट पेज पर देखकर जान सकते हैं। यह कतार में आपकी वर्तमान स्थिति दिखाता है और आगे के लोग बुलाए या served होते ही अपडेट होता है।",
        details: [
          "सूचनाएं उपलब्ध और enabled होने पर कतार turn updates भी भेज सकती है।",
          "सबसे अच्छा तरीका है कि सेवा पूरी होने तक अपना टिकट पेज उपलब्ध रखें।"
        ],
        keywords: ["कतार स्थिति", "बारी अपडेट", "लाइव कतार स्टेटस"],
        related: [
          "how-to-join-a-line",
          "how-can-customers-join-a-queue-by-qr-code",
          "how-does-a-virtual-queue-work"
        ]
      }
    ]
  }
};

export function getHelpArticle(locale: Locale, slug: string) {
  return helpContent[locale].articles.find((article) => article.slug === slug);
}

export function getHelpPath(slug = "") {
  return slug ? `/help/${slug}` : "/help";
}
