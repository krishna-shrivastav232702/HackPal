from flask import Flask, request,jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import tempfile
import os
from agno.knowledge.pdf import PDFKnowledgeBase,PDFReader
from agno.models.google import Gemini
from agno.agent import Agent,AgentMemory
from agno.tools.duckduckgo import DuckDuckGoTools
import uuid
from agno.team.team import Team
from agno.storage.postgres import PostgresStorage
from agno.memory.db.postgres import PgMemoryDb
from agno.memory.team import TeamMemory
from agno.vectordb.pgvector import PgVector
from agno.embedder.sentence_transformer import SentenceTransformerEmbedder
from agno.exceptions import ModelProviderError
import logging

load_dotenv()

os.environ["GEMINI_API_KEY"]= os.getenv("GEMINI_API_KEY")
db_url=os.getenv("DATABASE_URL")
MEMORY_WINDOW_SIZE = 10

shared_memory = AgentMemory(
        db=PgMemoryDb(table_name="team_memory", db_url=db_url)
)

team_memory = TeamMemory(
    db=PgMemoryDb(table_name="team_memory", db_url=db_url)
)

user_knowledge_base = {}


def create_pdf_knowledge_base(pdf_path):
    kb = PDFKnowledgeBase(
        path=pdf_path,
        vector_db=PgVector(
            table_name="pdf_knowledge_base",
            db_url=db_url,
            embedder=SentenceTransformerEmbedder(dimensions=384),
        ),
        reader=PDFReader()
    )
    kb.load(recreate=False, upsert=True)
    return kb


def get_or_create_knowledge_base(session_id,pdf_path=None):
    if session_id not in user_knowledge_base:
        if pdf_path:
            user_knowledge_base[session_id] = create_pdf_knowledge_base(pdf_path)
        else:
            user_knowledge_base[session_id] = None
    return user_knowledge_base[session_id]

app = Flask(__name__)
CORS(app)

def get_base_model():
    return Gemini(
        id="gemini-2.0-flash",
        api_key = os.getenv("GEMINI_API_KEY")
    )

def create_idea_generator_agent(session_id,knowledge_base=None):
    return Agent(
        name="Idea Generator",
        model = get_base_model(),
        role = "You are an innovative idea generator for hackathon projects .",
        memory=shared_memory,
        session_id=session_id,
        add_history_to_messages=True,
        num_history_responses=MEMORY_WINDOW_SIZE,
        read_chat_history=True,
        knowledge=knowledge_base,
        search_knowledge=True,
        storage=PostgresStorage(table_name="agent_sessions",db_url=db_url),
        instructions=[
            "MANDATORY: ALWAYS search the knowledge base for EVERY query, including when resuming previous sessions."
            "Generate innovative hackathon project ideas tailored to the user's needs and context.",
            "CRITICAL: ALWAYS thoroughly search the knowledge base BEFORE responding to ANY query.",
            "Never claim you don't have information without first exhaustively searching the knowledge base.",
            "Search using multiple query formulations and synonyms to ensure comprehensive knowledge retrieval.",
            "Always reference any uploaded documents (resumes, PDFs, etc.) or knowledge base when formulating ideas.",
            "When documents are available, analyze the user's skills, experience, and background to suggest relevant projects.",
            "For each idea, provide:",
            "1. A catchy project name",
            "2. A concise description explaining how it relates to their background (referencing specific information from knowledge base)",
            "3. Core features (3-4 bullet points)",
            "4. Technical implementation approach using technologies that match their experience (as found in knowledge base)",
            "5. Potential challenges and solutions",
            "6. How this project would enhance their portfolio based on their current skills",
            "If the user asks about ideas related to their document/resume, explicitly reference information from the knowledge base.",
            "If information exists but is incomplete, provide what you found rather than claiming no information exists.",
            "Balance innovation with feasibility for implementation within a 24-48 hour hackathon timeframe."
        ],
        markdown=True
    )

def create_code_explainer_agent(session_id,knowledge_base=None):
    return Agent(
        name="Code Explainer",
        model=get_base_model(),
        role = "You explain code snippets in english",
        add_history_to_messages=True,
        num_history_responses=MEMORY_WINDOW_SIZE,
        read_chat_history=True,
        memory=shared_memory,
        knowledge=knowledge_base,
        session_id=session_id,
        search_knowledge=True,
        storage=PostgresStorage(table_name="agent_sessions",db_url=db_url),
        instructions=[
            "MANDATORY: ALWAYS search the knowledge base for EVERY query, including when resuming previous sessions."
            "Explain code snippets in clear, accessible language appropriate to the user's background.",
            "CRITICAL: ALWAYS thoroughly search the knowledge base BEFORE responding to ANY query.",
            "Never claim you don't have information without first exhaustively searching the knowledge base.",
            "Search using multiple query formulations and synonyms to ensure comprehensive knowledge retrieval.",
            "If document context is available, adjust your explanations to match the user's apparent technical level.",
            "If the user's resume or documents mention specific programming languages or frameworks, reference those when explaining related code.",
            "For each explanation, include:",
            "1. An overview of what the code accomplishes",
            "2. Breakdown of key functions and their purposes",
            "3. Important variables and data structures",
            "4. The execution flow",
            "5. Used libraries/frameworks and their purposes",
            "6. Improvements or best practices",
            "7. Connections to the user's experience if their documents suggest relevant background",
            "If information exists but is incomplete, provide what you found rather than claiming no information exists.",
            "Use analogies or comparisons to concepts the user is likely familiar with based on their background."
        ],
        markdown=True
    )

def create_error_debugger_agent(session_id,knowledge_base=None):
    return Agent(
        name="Error Debugger",
        model=get_base_model(),
        role="You debug code errors expertly. ",
        add_history_to_messages=True,
        num_history_responses=MEMORY_WINDOW_SIZE,
        session_id=session_id,
        read_chat_history=True,
        memory=shared_memory,
        knowledge=knowledge_base,
        search_knowledge=True,
        storage=PostgresStorage(table_name="agent_sessions",db_url=db_url),
        instructions=[
            "MANDATORY: ALWAYS search the knowledge base for EVERY query, including when resuming previous sessions."
            "Debug code errors comprehensively with solutions tailored to the user's context.",
            "CRITICAL: ALWAYS thoroughly search the knowledge base BEFORE responding to ANY query.",
            "Never claim you don't have information without first exhaustively searching the knowledge base.",
            "Search using multiple query formulations and synonyms to ensure comprehensive knowledge retrieval.",
            "If document context exists or knowledge base exists, analyze the user's background to provide debugging guidance at their technical level.",
            "When suggesting fixes, consider technologies and languages mentioned in their uploaded documents.",
            "For each debugging response:",
            "1. Clearly explain the error's meaning and cause",
            "2. Provide step-by-step solutions with explicit code examples",
            "3. Explain why the error occurred in terms relevant to their background",
            "4. Suggest preventative measures for future development",
            "5. Recommend debugging tools or techniques aligned with their apparent experience level",
            "If the error relates to technologies mentioned in their documents, highlight the connection.",
            "If information exists but is incomplete, provide what you found rather than claiming no information exists.",
            "Always provide actionable solutions that can be implemented quickly in a hackathon environment."
        ],
        markdown=True
    )

def create_pdf_summarizer_agent(session_id,knowledge_base=None):
    agent = Agent(
        name="PDF Assistant",
        model=get_base_model(),
        role="You summarize documents effectively",
        add_history_to_messages=True,
        num_history_responses=MEMORY_WINDOW_SIZE,
        memory=shared_memory,
        session_id=session_id,
        read_chat_history=True,
        storage=PostgresStorage(table_name="agent_sessions",db_url=db_url),
        knowledge=knowledge_base,
        search_knowledge=True,
        instructions=[
            "MANDATORY: ALWAYS search the knowledge base for EVERY query, including when resuming previous sessions."
            "Analyze and extract key information from uploaded documents with a focus on context-relevant details.",
            "CRITICAL: ALWAYS thoroughly search the knowledge base BEFORE responding to ANY query.",
            "Never claim you don't have information without first exhaustively searching the knowledge base.",
            "Search using multiple query formulations and synonyms to ensure comprehensive knowledge retrieval.",
            "Your PRIMARY role is to make document information accessible and useful for other tasks.",
            "For document queries:",
            "1. Extract and summarize main topics and key points",
            "2. Identify skills, experiences, projects, and technical knowledge mentioned",
            "3. Highlight education, work history, and relevant qualifications",
            "4. Recognize interests, goals, and specializations",
            "5. Parse technical requirements, specifications, or constraints from documents",
            "When the user references information that might be in their documents, ALWAYS check the knowledge base first.",
            "If information exists but is incomplete, provide what you found rather than claiming no information exists.",
            "Provide comprehensive answers about document content and connect information to the user's current needs.",
            "If asked about specific details ('What projects did I work on?'), search thoroughly in the knowledge base multiple times with different query formulations."
        ],
        markdown=True
    )
    return agent

def create_chat_agent(session_id,knowledge_base=None):
    return Agent(
        name="General Assistant",
        model=get_base_model(),
        role = "You are HackPal, a knowledgeable hackathon assistant.",
        add_history_to_messages=True,
        num_history_responses=MEMORY_WINDOW_SIZE,
        session_id=session_id,
        read_chat_history=True,
        memory=shared_memory,
        search_knowledge=True,
        knowledge=knowledge_base,
        storage=PostgresStorage(table_name="agent_sessions",db_url=db_url),
        instructions=[
            "MANDATORY: ALWAYS search the knowledge base for EVERY query, including when resuming previous sessions."
            "Provide helpful assistance on hackathons, programming, and technology with personalization from available context.",
            "CRITICAL: ALWAYS thoroughly search the knowledge base BEFORE responding to ANY query.",
            "Never claim you don't have information without first exhaustively searching the knowledge base.",
            "Search using multiple query formulations and synonyms to ensure comprehensive knowledge retrieval.",
            "For EVERY query, check if document context is relevant before responding.",
            "When documents are available:",
            "1. Reference the user's background, skills, and experience in your advice",
            "2. Tailor recommendations to technologies they're familiar with",
            "3. Consider their apparent skill level in your explanations",
            "4. Connect general advice to their specific situation or goals",
            "For technology questions, use web search to provide up-to-date information.",
            "If the query relates to career, projects, or personal development, explicitly use information from their documents.",
            "If information exists but is incomplete, provide what you found rather than claiming no information exists.",
            "Recognize when a query might benefit from document context even if not explicitly requested.",
            "Always maintain awareness of the complete conversation context when responding."
        ],
        tools=[DuckDuckGoTools()],
        markdown=True
    )

def create_hackpal_team(session_id,knowledge_base=None):
    return Team(
        name="HackPal Team",
        mode="route",  
        model=get_base_model(),
        members=[
            create_idea_generator_agent(session_id,knowledge_base),
            create_code_explainer_agent(session_id,knowledge_base),
            create_error_debugger_agent(session_id,knowledge_base),
            create_pdf_summarizer_agent(session_id,knowledge_base),
            create_chat_agent(session_id,knowledge_base)
        ],
        session_id=session_id,
        show_tool_calls=True,
        enable_agentic_context=True,
        share_member_interactions=True,
        memory=team_memory,
        enable_team_history=True,
        num_of_interactions_from_history=MEMORY_WINDOW_SIZE,
        markdown=True,
        instructions=[
            "MANDATORY: ALWAYS search the knowledge base for EVERY query, including when resuming previous sessions."
            "Route queries to the most appropriate specialized agent while maintaining context awareness.",
            "CRITICAL REQUIREMENT: For EVERY query, first thoroughly search the knowledge base for relevant information BEFORE responding.",
            "Never claim you don't have information without first exhaustively searching the knowledge base.",
            "Search using multiple query formulations and synonyms to ensure comprehensive knowledge retrieval.",
            "Routing guidelines:",
            "- Idea Generator: For project brainstorming, ideation, or concept development",
            "- Code Explainer: For understanding code, concepts, or implementation details",
            "- Error Debugger: For fixing errors, troubleshooting, or resolving technical issues",
            "- PDF Assistant: For direct document queries or when deep document analysis is the primary need",
            "- General Assistant: For general advice, technology questions, or multi-faceted queries",
            "Knowledge base validation process:",
            "1. First search the knowledge base extensively for ANY information related to the query",
            "2. Only state you don't have information AFTER confirming it's not in the knowledge base",
            "3. If partial information exists, provide it with appropriate context rather than claiming ignorance",
            "4. For ambiguous queries, search the knowledge base with multiple related terms and concepts",
            "When the query relates to multiple domains (e.g., 'suggest projects based on my resume skills'):",
            "1. First extract relevant document information from knowledge base",
            "2. Then route to the specialized agent with this context included",
            "If information exists but is incomplete, provide what you found rather than claiming no information exists.",
            "Recognize when a query requires document context or knowledge base even when not explicitly mentioned.",
        ],
        show_members_responses=False
    )


@app.route("/api/hackpal",methods=['POST'])
def hackpal_endpoint():

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
    else:
        data = request.json or {}

    session_id = data.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
        print(f"Started Session: {session_id}\n")
    message = data.get('message', '')

    pdf_path = None
    if 'pdf' in request.files:
        pdf_file = request.files.get('pdf')
        if pdf_file and pdf_file.filename:
            temp_dir = tempfile.gettempdir()
            pdf_path = os.path.join(temp_dir, f"{session_id}_{pdf_file.filename}")
            pdf_file.save(pdf_path)
            print(f"PDF saved to: {pdf_path}")
            # knowledge_base = create_pdf_knowledge_base("AI/res.pdf")

    try:
        knowledge_base = get_or_create_knowledge_base(session_id,pdf_path)
        response = create_hackpal_team(session_id, knowledge_base).run(message)
        # print("response",response.content)
        return jsonify({
            "response":response.content,
            "session_id":session_id
        })
    except ModelProviderError as e:
        logging.error(f"ModelProviderError: {str(e)}")
        return jsonify({
            "error": "An error occurred with the AI model provider",
            "details": str(e)
        }), 503
    except Exception as e:
        logging.exception("An unexpected error occurred")
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(e)
        }), 500
    finally:
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT',5000))
    app.run(debug=os.environ.get('DEBUG','False').lower()=='true',host='0.0.0.0',port=port)