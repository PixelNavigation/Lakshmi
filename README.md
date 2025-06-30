![image](https://github.com/user-attachments/assets/0fea79b4-394a-4e02-824e-b9345abb632c)
![image](https://github.com/user-attachments/assets/627cd930-895f-425a-ba1a-50753def37ec)
![image](https://github.com/user-attachments/assets/02ee15c8-401b-4e93-b689-e6e5cfec9016)


Purpose and Scope

Lakshmi is an AI-powered Indian stock market trading platform that combines natural language processing, voice commands, and comprehensive market analysis tools. The system provides users with an intelligent trading assistant that can execute trades, analyze market data, visualize stock relationships, and deliver personalized investment insights through both web and voice interfaces.

This document covers the overall system architecture, core components, and technology stack of the Lakshmi platform. For detailed information about specific subsystems, see:

-Frontend components and user interfaces: Frontend Components
-Backend APIs and trading system: Backend APIs
-AI and analysis features: AI and Analysis Features
-External service integrations: External Integrations

System Architecture

Lakshmi follows a modern full-stack architecture built on Next.js with integrated AI capabilities and voice command support. The system consists of a React-based frontend, Next.js API backend, Python analysis engine, and multiple external service integrations.

Core Architecture Overview
![image](https://github.com/user-attachments/assets/f1c3359f-9afc-4d97-ae2b-60fecadd193e)

Application Bootstrap and Authentication Flow
![image](https://github.com/user-attachments/assets/c747d871-7371-4d2c-8abe-0a3a7c73aa85)

Technology Stack
The platform is built using modern web technologies with a focus on performance, scalability, and user experience.
![image](https://github.com/user-attachments/assets/381d817c-3bb4-4a8b-96d1-82937cd465aa)

Development Environment
The application uses a concurrent development setup that runs both the Next.js frontend and Python backend simultaneously:
![image](https://github.com/user-attachments/assets/5720c259-bc46-43d8-b041-131d6d4d1a34)

Core Features and Capabilities
Lakshmi provides a comprehensive suite of trading and analysis tools integrated into a unified platform:

Primary User Interfaces
Dashboard - Market overview and watchlist management
Portfolio - Holdings tracking and balance management
LakshmiAI - Conversational AI assistant for trading guidance
StockGraph - Network visualization of stock correlations
News - Market news aggregation and analysis
Search - Comprehensive symbol discovery and screening
AI-Powered Features
Natural Language Trading: Voice and text commands for trade execution
Market Analysis: Statistical analysis using Granger causality and correlation
News Intelligence: Automated sentiment analysis and stock impact assessment
Relationship Mapping: Network graphs showing stock interdependencies


Voice Trading Integration
The platform integrates OmniDimension's voice interface for hands-free trading operations:
![image](https://github.com/user-attachments/assets/1d06e65e-f687-4896-99ec-c1079e1728d1)

Data Flow and State Management
The application manages state through React Context and external service integrations:

Authentication and Session Management
The AuthContext provides centralized user state management throughout the application:
![image](https://github.com/user-attachments/assets/58f893c1-a77c-4885-b548-9ad6cb390306)

External Service Integration Architecture
The platform integrates with multiple external services to provide comprehensive market data and functionality:
![image](https://github.com/user-attachments/assets/937b89f5-8ba8-4df5-894d-cc12da5e4d61)


