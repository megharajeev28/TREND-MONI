# TREND-MONI
Multi-Agent Social Intelligence System
This project is a sophisticated multi-agent AI system designed to automate social media intelligence for brand teams. It tracks a curated list of influencers and competitors across multiple platforms, analyzes their content in near real-time, and delivers actionable trend briefs every 48 hours.

🎯 The Problem
In the fast-paced digital landscape, brand teams struggle to manually keep up with the content posted by key influencers and competitors. This delay means missed opportunities, overlooked trends, and a reactive rather than proactive brand strategy. This system solves that by providing automated, timely, and insightful analysis.

✨ Features
Automated Multi-Platform Monitoring: Tracks handles on YouTube, Instagram, and LinkedIn.

Deep Content Analysis: Uses advanced AI for Natural Language Processing (NLP) and Computer Vision (CV) to understand text, images, and video.

Trend & Sentiment Identification: Automatically spots emerging trends, keywords, and shifts in public sentiment.

Scheduled Reporting: Delivers a concise, actionable trend brief to your team every 48 hours.

Extensible Architecture: Built on a flexible multi-agent framework that is easy to extend and customize.

🏗️ System Architecture
This project is not a monolithic application but a multi-agent system where specialized agents collaborate to achieve a complex task. The entire workflow is managed by an orchestration framework like LangChain.

The system is composed of three core agent types:

Scout Agents 🕵️‍♂️: These are the data gatherers. They monitor the specified social media profiles and collect raw data like posts, video transcripts, and comments.

Analyst Agents 🔬: These agents process the raw data. They use NLP models to summarize text and perform sentiment analysis, and CV models to understand images and video content.

Reporter Agent 🤖: The final agent in the workflow. It aggregates the insights from the Analyst agents, identifies high-level trends, and compiles the final, human-readable brief.

Workflow Diagram
sequenceDiagram
    participant Scheduler
    participant Scout Agents
    participant Analyst Agents
    participant Reporter Agent
    participant Brand Team

    Scheduler->>Scout Agents: Trigger 48-hour cycle
    Scout Agents->>Scout Agents: Fetch new content from YouTube, Instagram, LinkedIn
    Scout Agents-->>Analyst Agents: Pass raw content data
    Analyst Agents->>Analyst Agents: Perform NLP & CV Analysis in parallel
    Analyst Agents-->>Reporter Agent: Pass enriched data (summaries, tags, sentiment)
    Reporter Agent->>Reporter Agent: Aggregate insights & identify macro-trends
    Reporter Agent-->>Brand Team: Deliver formatted Trend Brief (Email/Slack)


<img width="2048" height="1778" alt="AI AGENT " src="https://github.com/user-attachments/assets/2704cb3d-8caf-4492-bfdf-6b6c5357ba51" />

    
