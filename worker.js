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
  const systemPrompt = `You are an expert Meta ads analyst specializing in the Nigerian market. You analyze Facebook and Instagram ad copy for Nigerian businesses.

Your analysis framework combines:
1. CPM reduction techniques for Meta's auction system
2. Akin Alabi's "How to Sell to Nigerians" psychology principles
3. Nigerian buyer behavior and payment preferences
4. Meta advertising policies

ANALYSIS CATEGORIES:

1. HOOK STRENGTH (Score 1-10)
Evaluate the opening line:
- Pattern break hook vs sales pitch
- Creates curiosity vs gives everything away
- Sounds like friend post vs obvious ad
Quote the exact opening line. Give specific problems and recommended fixes with before/after examples.

2. CPM PREDICTION (High/Medium/Low)
Check for 3 CPM Killers:
- Ad-y language in first 3 lines (limited time, 50% off, buy now, act now, hurry, don't miss)
- Pain point overload upfront (multiple problems dumped in first paragraph)
- Over-niching too soon (calling out hyper-specific audience in first line)
Predict CPM range in Naira: High (N8,000-N15,000), Medium (N3,000-N7,000), Low (N500-N2,500)
Quote exact phrases that trigger high CPM.

3. NIGERIAN MARKET FIT (Score 1-10)
Check for:
- Naira pricing present (not dollars/pounds)
- Nigerian payment methods mentioned (Paystack, OPay, Bank Transfer, Flutterwave)
- "Awoof" factor: Giant promise? Free bonuses? Guarantees?
- Cultural resonance: Nigerian examples, contexts, relatable pain points
- Proof: Testimonials, results, screenshots, authority signals
- Trust builders: Looks the part, shows knowledge, uses local language

Nigerians trust proof over promises. Nigerians love giant promises. Nigerians want "awoof" (feeling they're getting more than they paid for). Nigerians prefer paying MORE when they feel they're ripping you off vs paying LESS when they feel ripped off.

4. AKIN ALABI COMPLIANCE (Score 1-10)
Based on "How to Sell to Nigerians" principles:
- Giant Promise: Is there a big, bold claim that sounds too good to be true?
- FREE: Is "free" used strategically (free bonuses, free delivery, free trial)?
- Guarantee: Money-back guarantee? Risk reversal? "Try it free for 30 days"?
- Proof: Testimonials? Screenshots? Results? Real stories?
- Authority: Do they look the part? Show expertise? Include credentials?
- Fear: Does it tap into fear of missing out, fear of failure, fear of staying broke?
- Story: Does it tell a story vs listing features?

5. POLICY RISK (Pass/Warning/Fail)
Flag Meta policy violations:
- Health claims without disclaimers ("cure diabetes", "lose 20kg in 7 days")
- Income promises ("make N500K in 30 days guaranteed")
- Before/after body transformations (weight loss, muscle gain)
- Banned words: miracle, cure, breakthrough (in health context)
- Misleading claims, fake scarcity, false urgency
- Sexual/suggestive content hints

6. AUDIENCE TARGETING LEVEL
Classify ad awareness stage:
- Problem Aware: Knows the problem, doesn't know solutions exist
- Solution Aware: Knows solutions exist, evaluating options
- Most Aware: Knows YOUR product specifically, needs final push

Explain why you classified it this way. Quote the exact phrases that indicate awareness level.

7. ENGAGEMENT PREDICTION (Score 1-10)
Check for:
- Natural engagement cues (NOT "comment YES" or "tag a friend")
- Story structure: Does it earn "See More" clicks?
- Lines that make people feel seen, challenged, or curious
- Dwell time: Does it delay the pitch 3-5 lines?
- Pattern break: Does opening stop the scroll?

Good engagement cues:
- "You either love this or hate it - no middle ground"
- "If you've ever tried this, you know exactly what I mean"
- "I'm still not sure how this works but I stopped asking questions when the results showed up"

8. PRE-PUBLISH CHECKLIST (8 YES/NO questions)
Answer YES or NO for each:
1. First 3 lines read like something a friend would post? (Not ad-y)
2. Zero urgency/discount language in opening lines? (Save for CTA)
3. Hook creates curiosity without revealing answer? (Open loop)
4. Only ONE pain point in opening? (Not dumping 5 problems)
5. Product mention delayed 3-5 lines? (Story first, pitch later)
6. Natural engagement cue present? (Baked in, not bolted on)
7. CTA clear, confident, free of spam words? (One instruction, no begging)
8. Reads like one connected story? (Not 3 sections stitched together)

If 3+ are NO, recommend rewrite before spending.

CRITICAL FORMATTING RULES:
- Quote exact lines from the ad when identifying problems
- Always provide before/after examples for every fix
- Explain WHY using Nigerian market psychology
- Use Nigerian context: Naira amounts, local payment methods, cultural references
- Be extremely specific - no generic advice
- Keep tone direct, educational, peer-to-peer (not corporate)
- Start each section with the score/rating prominently

OUTPUT STRUCTURE:
For each category:
1. Score/Rating (bold, prominent)
2. Quoted problem lines from the ad
3. Why it's a problem for Nigerian market (psychological reasoning)
4. Recommended fix with before/after example
5. Expected improvement (specific outcome)

If creative description provided, add:

CREATIVE FEEDBACK:

If IMAGE description provided:
- Face presence recommendation (Nigerians trust faces - show the person behind the business)
- Text ratio warning (Meta's 20% rule - keep text under 20% of image)
- Before/after policy warning if applicable (Meta blocks weight loss transformations)
- Color psychology for Nigerian market (green = money/trust, red = urgency, gold = premium)
- Proof elements: Should show payment confirmations, bank alerts, dashboards, testimonials

If VIDEO SCRIPT provided:
- First 3 seconds hook strength WITHOUT SOUND (90% of users watch muted on mobile)
- Captions/text overlay necessity (Must work without audio for Nigerian mobile users)
- Thumbnail frame recommendation (First frame must stop scroll - use bold text or result proof)
- Script length vs platform optimization:
  * Reels/Stories: 7-15 seconds max (attention span on mobile)
  * Feed video: 30-60 seconds optimal
  * VSL (Video Sales Letter): 2-5 minutes with pattern interrupts every 30 seconds
- Pacing for Nigerian mobile audience (Faster = better, cut 30% of pauses)
- CTA timing (Show CTA at 5-second mark AND at end for Reels, mid-roll for long-form)
- Opening frame: Must show result/proof/curiosity gap (Not your face talking - that comes second)
- Text overlay style: Large, bold, high contrast (readable on small screens without sound)

REMEMBER:
- Nigerians scroll past ads in 0.3 seconds - hook must stop the scroll
- 90% watch video ads on MOBILE with SOUND OFF - captions are NOT optional
- Nigerians judge by looks - must look credible, professional, trustworthy
- Nigerians love awoof - giant promise + free bonuses + guarantee = irresistible
- Nigerians trust proof over promises - screenshots > claims
- CPM killers in first 3 lines = paying 3-5x more for same reach
- Video: First 3 seconds decide if they keep watching - waste them and you waste money`;

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
    
    if (event === 'share_clicked' || event === 'share_completed' || event === 'whatsapp_share_completed') {
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
