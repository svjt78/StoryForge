# backend/story_generator.py
import openai
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
import logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

class StoryOutput(BaseModel):
    Title: str
    Story: str

def generate_story(user_input: dict) -> dict:
    logging.debug("Received payload: %s", user_input)
    if "clarifying_responses" in user_input and user_input["clarifying_responses"]:
        try:
            story_size = int(user_input.get("storySize", 1000))
        except ValueError:
            story_size = 1000
        # Reserve extra tokens for title/instructions overhead
        max_tokens_calculated = int(story_size * 1.25) + 150

        # Extract key parameters
        author_pref = user_input.get("authorPreference", "")
        framework = user_input.get("storytellingFramework", "")
        extra_plot = user_input.get("details", "")
        clarifying = user_input.get("clarifying_responses", "")

        prompt = f"""
<System>
You are an expert storyteller, novelist, and narrative designer.
</System>

<Context>
The user has provided the following details:
- Genre: {user_input.get("genre", "")}
- Setting: {user_input.get("setting", "")}
- Characters: {user_input.get("characters", "")}
- Themes: {user_input.get("themes", "")}
- Additional Plot Points: {extra_plot}
- Author to mimic: {author_pref if author_pref else "None"}
- Storytelling Framework: {framework if framework else "None"}
- Clarifying Responses: {clarifying}
</Context>

<Instructions>
1. Generate a rich narrative that follows advanced storytelling techniques.
2. If an author preference is provided, mimic that writing style.
3. If a storytelling framework is provided, adhere to its structure.
4. The story must be exactly or very close to {story_size} words. Do not exceed this word count.
5. Also, create a concise short title for the story.
Output the result in plain text in the following format:

Title: <short title here>
---
<story narrative here>
</Instructions>
"""

        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=max_tokens_calculated
        )
        result_text = response.choices[0].message.content
        words = result_text.split()
        if len(words) > (story_size + 120):
            return ' '.join(words[:story_size])
        return result_text
    else:
        # Generate clarifying questions as before...
        prompt = f"""
<System>
You are an expert storyteller, novelist, and narrative designer.
</System>

<Context>
The user provided the following details: {user_input}
</Context>

<Instructions>
1. Analyze the provided details and determine if further clarification is needed.
2. If clarification is needed, output a JSON object with a key "questions" that maps to an array of clarifying questions (each as a string).
Do not generate the final story.
</Instructions>

Please output only the JSON object.
"""
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=150
        )
        result_text = response.choices[0].message.content
        try:
            data = json.loads(result_text)
            questions = data.get("questions", [])
        except Exception as e:
            questions = [q.strip() for q in result_text.split("\n") if q.strip()]
        return {"questions": questions}

def generate_image(prompt_text: str) -> str:
    response = openai.Image.create(
        prompt=prompt_text,
        n=1,
        size="1024x1024"
    )
    image_url = response["data"][0]["url"]
    return image_url
