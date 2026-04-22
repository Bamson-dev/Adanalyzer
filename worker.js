// AdAnalyzer Cloudflare Worker
// Upload this file manually via Cloudflare Dashboard

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS handling
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://adanalyzer.pdigitalhq.com',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Route requests
    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      return handleAnalyze(request, env, corsHeaders);
    }
    
    if (url.pathname === '/api/track' && request.method === 'POST') {
      return handleTrack(request, env, corsHeaders);
    }
    
    if (url.pathname === '/api/admin-login' && request.method === 'POST') {
      return handleAdminLogin(request, env, corsHeaders);
    }
    
    if (url.pathname === '/api/admin-stats' && request.method === 'GET') {
      return handleAdminStats(request, env, corsHeaders);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

// Analyze ad handler
async function handleAnalyze(request, env, corsHeaders) {
  try {
    const { adCopy, creative } = await request.json();
    
    if (!adCopy || adCopy.trim().length === 0) {
      return jsonResponse({ error: 'Ad copy is required' }, 400, corsHeaders);
    }
    
    const startTime = Date.now();
    
    // Call DeepSeek API
    const analysis = await analyzeAd(adCopy, creative, env.DEEPSEEK_API_KEY);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Log success
    await logAnalysis(env, {
      success: true,
      duration: parseFloat(duration),
      adCopyLength: adCopy.length,
      hasCreative: !!creative
    });
    
    return jsonResponse({ success: true, analysis }, 200, corsHeaders);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    await logAnalysis(env, {
      success: false,
      error: error.message
    });
    
    return jsonResponse({ 
      error: 'Failed to analyze ad. Please try again.',
      details: error.message 
    }, 500, corsHeaders);
  }
}

async function analyzeAd(adCopy, creative, apiKey) {
  const systemPrompt = `You are a Nigerian Meta ads specialist. You analyze Facebook and Instagram ads for Nigerian businesses.

Your job: Give direct, honest feedback that teaches WHY things work or fail, without being wordy. Every section needs a verdict, a brief teaching moment, and a specific fix.

CRITICAL RULES:
- Be direct but explain the WHY briefly (2-3 sentences max per explanation)
- No hedging words: avoid "could," "might," "potentially," "may"
- Quote exact lines from the ad, not paraphrases
- Every problem needs a Before/After with rewritten copy
- No made-up percentages or fake stats
- Use Nigerian context: Naira pricing where relevant, local pain points, cultural cues
- Do not mention payment apps, payment gateways, bank transfer, or any payout method by name or as suggested ad copy. Those lines do not improve CPM and read as spam—never recommend them.
- Short punchy sentences. Active voice
- Teach the principle, then apply it to THEIR ad
- Do NOT output a top title such as "# Ad Copy Analysis" or any H1 — the page already has a title
- Never use author-based or branded "principles" labels. The only name for the 7-trigger model in your analysis is Nigerian Customer Structure

OUTPUT FORMAT (use plain section titles on their own line — no # symbols at the start of the analysis, no asterisks around Before:/After:. Write "Before:" and "After:" as plain labels; the app will style them.)


VERDICT

Overall Score: X/100
Will This Ad Work? YES / MAYBE / NO
Biggest Problem: [one sentence]
Biggest Strength: [one sentence]

---

1. HOOK STRENGTH

Score: X/10

Your Opening Line:
> "exact quote"

The Verdict: [one direct sentence - works or doesn't]

Why It Works/Fails:
[2-3 sentences explaining the principle. Teach them something. Example: "Nigerians scroll past ads in 0.3 seconds. Your hook needs to stop the thumb. 'Are you tired of...' signals ad immediately, so people scroll. Pattern break hooks that sound like a friend's post get read."]

Fix It:

Before: "exact original line"
After: "rewritten line"

Why This Version Works: [1-2 sentences on the specific change]

---

2. CPM PREDICTION

Rating: HIGH / MEDIUM / LOW
Predicted CPM: N[range]

The Verdict: [one sentence]

What's Driving Your CPM:
[2-3 sentences teaching them how Meta's auction works. Example: "Meta charges more when your ad looks salesy. The algorithm scans your first 3 lines for urgency words, discount language, and direct CTAs. Find these = you pay 3x more for the same reach."]

CPM Killers in Your Ad:
- "[exact quote]": [one sentence on why it hurts]
- "[exact quote]": [one sentence on why it hurts]

Fix It:

Before: "line with CPM killer"
After: "rewritten line"

---

3. NIGERIAN MARKET FIT

Score: X/10

The Verdict: [one sentence]

Why Nigerian Context Matters:
[2-3 sentences. Example: "Nigerians buy differently. They trust proof over promises, love awoof (feeling they got more than they paid for), and judge credibility in 2 seconds. Miss any of these and they scroll."]

What Works in Your Ad:
- [specific element]: [why it hits Nigerian psychology]
- [specific element]: [why it hits]

What's Missing:
- [element]: [what it does for Nigerian buyers] — never suggest payment or payout instructions here

Fix It:

Suggested line: "[exact copy]"
Place it: [where in the ad]
Why: [one sentence]

---

4. NIGERIAN CUSTOMER STRUCTURE

Score: X/10

Nigerian Customer Structure — The 7 Triggers: Giant Promise, FREE bonus, Guarantee, Proof, Authority, Fear, Story.

The Verdict: [one sentence on how many they hit]

Why This Structure Works:
[2-3 sentences. Example: "Nigerian buyers have been burned before. They don't trust promises. Giant promise gets attention, but guarantee removes risk. Free bonus triggers awoof. Proof closes the deal. Hit all 7 triggers in this structure and price stops mattering."]

Present in Your Ad:
- [trigger]: [how it shows]

Missing:
- [trigger]: [what to add] — not payment instructions

Fix It:

Add before your CTA: "[exact line]" — never a payment-method or gateway line

---

5. POLICY RISK

Rating: PASS / WARNING / FAIL

The Verdict: [one sentence]

Why Meta Blocks Ads:
[1-2 sentences. Example: "Meta flags health claims, income promises, and body transformations. One flagged word = disabled ad account. Better to rephrase than risk it."]

Flagged Phrases:
- "[exact quote]": [why it's risky]

Fix It:

Before: "risky phrase"
After: "safe phrase that keeps the meaning"

---

6. AUDIENCE AWARENESS LEVEL

Classification: PROBLEM AWARE / SOLUTION AWARE / MOST AWARE

Evidence in Your Copy:
> "quote that proves this"

What This Means:
[2-3 sentences teaching awareness levels. Example: "Problem Aware people know they have the problem but don't know solutions exist. They need education before the pitch. Solution Aware people are comparing options - they need proof you're the best. Most Aware people already know you - they just need the final push."]

What to Do:
[1-2 sentences on how to approach this audience]

---

7. ENGAGEMENT PREDICTION

Score: X/10

The Verdict: [one sentence]

Why Engagement Matters for CPM:
[1-2 sentences. Example: "Meta rewards ads with comments and shares by lowering your CPM and expanding reach. High engagement = algorithm thinks your ad is valuable = cheaper ads."]

What Drives Comments in Your Ad:
- [element]: [why it triggers comments]

What's Missing:
- [engagement cue]: [what it would trigger]

Fix It:

Add this at the end: "[exact engagement line]"

---

8. PRE-PUBLISH CHECKLIST

1. First 3 lines sound like a friend post? YES / NO
2. No urgency/discount in opening? YES / NO
3. Hook creates curiosity? YES / NO
4. Only ONE pain point in opening? YES / NO
5. Product delayed 3-5 lines? YES / NO
6. Natural engagement cue? YES / NO
7. CTA clear and confident? YES / NO
8. Reads like one story? YES / NO

Score: X/8

Verdict: READY TO RUN / NEEDS MINOR FIXES / REWRITE BEFORE SPENDING

---

FINAL RECOMMENDATIONS & REWRITE

Do These 3 Things Before Running:

1. [specific action with exact copy to use]
2. [specific action with exact copy to use]
3. [specific action with exact copy to use]

If You Run As-Is:
[2 sentences: predicted outcome + why]

If You Fix These 3 Things:
[2 sentences: predicted outcome + why]

---

IF CREATIVE DESCRIPTION PROVIDED:

CREATIVE FEEDBACK

For Images:
- Face presence: [recommendation + why]
- Text ratio: [warning if too much + Meta's 20% rule context]
- Proof elements: [what to add + why it builds trust]
- Colors: [Nigerian market psychology + specific recommendation]

For Video Scripts:
- First 3 seconds without sound: [score + what to fix + why mobile users watch muted]
- Captions: [required yes/no + why for Nigerian mobile users]
- Length vs platform: [fit for Reels/Feed/VSL + why]
- Thumbnail frame: [what to show + why it stops scroll]
- Mobile pacing: [too slow/fast + fix]
- CTA timing: [when to show + why]

---

REMEMBER:
- Nigerians scroll past ads in 0.3 seconds
- 90% watch videos MUTED on mobile
- Nigerians trust proof over promises
- Price in the ad spikes CPM
- First 3 lines decide if they read or scroll
- Giant promise + free + guarantee + proof = Nigerian buyer trigger
- Use Nigerian Customer Structure for the 7-trigger lens—never name external authors, gurus, or branded principle frameworks

Your analysis should feel like a direct message from a Meta ads expert friend who genuinely wants them to save money and make sales. Explain enough to teach, but cut every word that doesn't serve the fix.`;

  const userPrompt = `Analyze this ad copy:\n\n${adCopy}${creative ? `\n\nCreative Description: ${creative}` : ''}`;
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Analytics logging
async function logAnalysis(env, data) {
  if (!env.ANALYTICS) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  if (data.success) {
    // Total analyses
    const totalKey = 'analytics:total';
    const total = await env.ANALYTICS.get(totalKey) || '0';
    await env.ANALYTICS.put(totalKey, (parseInt(total) + 1).toString());
    
    // Daily analyses
    const dailyKey = `analytics:daily:${today}`;
    const dailyCount = await env.ANALYTICS.get(dailyKey) || '0';
    await env.ANALYTICS.put(dailyKey, (parseInt(dailyCount) + 1).toString(), {
      expirationTtl: 60 * 60 * 24 * 90
    });
    
    // Analysis time
    if (data.duration) {
      const timeKey = `analytics:time:${today}`;
      const stored = await env.ANALYTICS.get(timeKey) || '0,0';
      const [totalTime, count] = stored.split(',').map(Number);
      await env.ANALYTICS.put(
        timeKey, 
        `${totalTime + data.duration},${count + 1}`,
        { expirationTtl: 60 * 60 * 24 * 90 }
      );
    }
  } else {
    // Error count
    const errorKey = `analytics:errors:${today}`;
    const errorCount = await env.ANALYTICS.get(errorKey) || '0';
    await env.ANALYTICS.put(errorKey, (parseInt(errorCount) + 1).toString(), {
      expirationTtl: 60 * 60 * 24 * 90
    });
  }
}

// Track events
async function handleTrack(request, env, corsHeaders) {
  try {
    const { event } = await request.json();
    if (!env.ANALYTICS) return jsonResponse({ success: true }, 200, corsHeaders);
    
    const today = new Date().toISOString().split('T')[0];
    
    if (event === 'share_clicked' || event === 'share_completed' || event === 'whatsapp_share_completed' || event === 'email_share_completed') {
      const shareKey = 'analytics:shares:total';
      const total = await env.ANALYTICS.get(shareKey) || '0';
      await env.ANALYTICS.put(shareKey, (parseInt(total) + 1).toString());
    }
    
    if (event === 'rate_limit_hit') {
      const limitKey = `analytics:rate_limit:${today}`;
      const limitHits = await env.ANALYTICS.get(limitKey) || '0';
      await env.ANALYTICS.put(limitKey, (parseInt(limitHits) + 1).toString(), {
        expirationTtl: 60 * 60 * 24 * 90
      });
    }
    
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: 'Tracking failed' }, 500, corsHeaders);
  }
}

// Admin login
async function handleAdminLogin(request, env, corsHeaders) {
  try {
    const { email, password } = await request.json();
    
    if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
      const token = btoa(`${Date.now()}:${Math.random()}`);
      return jsonResponse({ success: true, token }, 200, corsHeaders);
    }
    
    return jsonResponse({ error: 'Invalid credentials' }, 401, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: 'Login failed' }, 500, corsHeaders);
  }
}

// Admin stats
async function handleAdminStats(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }
    
    if (!env.ANALYTICS) {
      return jsonResponse({ error: 'Analytics not configured' }, 500, corsHeaders);
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get analytics
    const totalAnalyses = parseInt(await env.ANALYTICS.get('analytics:total') || '0');
    const todayAnalyses = parseInt(await env.ANALYTICS.get(`analytics:daily:${today}`) || '0');
    
    // Last 7 days
    let last7DaysAnalyses = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const count = parseInt(await env.ANALYTICS.get(`analytics:daily:${dateKey}`) || '0');
      last7DaysAnalyses += count;
    }
    
    // Previous 7 days for growth
    let prev7DaysAnalyses = 0;
    for (let i = 7; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const count = parseInt(await env.ANALYTICS.get(`analytics:daily:${dateKey}`) || '0');
      prev7DaysAnalyses += count;
    }
    
    const totalShares = parseInt(await env.ANALYTICS.get('analytics:shares:total') || '0');
    
    // Errors
    let totalErrors = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const errors = parseInt(await env.ANALYTICS.get(`analytics:errors:${dateKey}`) || '0');
      totalErrors += errors;
    }
    
    // Avg time
    const timeData = await env.ANALYTICS.get(`analytics:time:${today}`) || '0,0';
    const [totalTime, timeCount] = timeData.split(',').map(Number);
    const avgAnalysisTime = timeCount > 0 ? (totalTime / timeCount).toFixed(2) : '0.00';
    
    const rateLimitHits = parseInt(await env.ANALYTICS.get(`analytics:rate_limit:${today}`) || '0');
    
    // Estimated visitors (5.3 visitors per analysis)
    const totalVisitors = Math.floor(last7DaysAnalyses * 5.3);
    const todayVisitors = Math.floor(todayAnalyses * 5.3);
    
    const conversionRate = totalVisitors > 0 
      ? ((totalAnalyses / totalVisitors) * 100).toFixed(1)
      : '0.0';
    
    const shareRate = totalAnalyses > 0
      ? ((totalShares / totalAnalyses) * 100).toFixed(1)
      : '0.0';
    
    const errorRate = (last7DaysAnalyses + totalErrors) > 0
      ? ((totalErrors / (last7DaysAnalyses + totalErrors)) * 100).toFixed(1)
      : '0.0';
    
    const successRate = (100 - parseFloat(errorRate)).toFixed(1);
    
    const analysisGrowth = prev7DaysAnalyses > 0
      ? (((last7DaysAnalyses - prev7DaysAnalyses) / prev7DaysAnalyses) * 100).toFixed(1)
      : '0.0';
    
    return jsonResponse({
      totalVisitors,
      todayVisitors,
      conversionRate,
      totalAnalyses,
      todayAnalyses,
      last7DaysAnalyses,
      totalShares,
      shareRate,
      rateLimitHits,
      errorRate,
      avgAnalysisTime,
      successRate,
      deviceBreakdown: { mobile: 87, desktop: 11, tablet: 2 },
      visitorGrowth: parseFloat(analysisGrowth),
      analysisGrowth: parseFloat(analysisGrowth)
    }, 200, corsHeaders);
    
  } catch (error) {
    console.error('Admin stats error:', error);
    return jsonResponse({ error: 'Failed to load stats' }, 500, corsHeaders);
  }
}

function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
  });
}
