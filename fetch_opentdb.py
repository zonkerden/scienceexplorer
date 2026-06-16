import urllib.request
import json
import html
import time
import random

categories_map = ["🌍 Earth", "🐾 Animals", "🌿 Plants", "⚗️ Matter", "🔭 Space", "🦴 Human Body", "⚡ Physics"]

def fetch_questions():
    questions = []
    seen = set()
    
    print("Fetching from OpenTDB...")
    
    # OpenTDB allows max 50 per request. We'll fetch multiple times to get a good amount.
    for i in range(10):
        try:
            url = "https://opentdb.com/api.php?amount=50&category=17&type=multiple"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                if data['response_code'] == 0:
                    for item in data['results']:
                        q_text = html.unescape(item['question'])
                        
                        if q_text in seen:
                            continue
                        seen.add(q_text)
                        
                        correct = html.unescape(item['correct_answer'])
                        incorrects = [html.unescape(x) for x in item['incorrect_answers']]
                        
                        opts = [correct] + incorrects
                        random.shuffle(opts)
                        correct_idx = opts.index(correct)
                        
                        # Assign category based on keywords
                        cat = "⚡ Physics"
                        lower_q = q_text.lower()
                        if any(w in lower_q for w in ['planet', 'star', 'space', 'moon', 'sun', 'galaxy', 'orbit', 'nasa']):
                            cat = "🔭 Space"
                        elif any(w in lower_q for w in ['animal', 'bird', 'fish', 'mammal', 'species', 'dog', 'cat']):
                            cat = "🐾 Animals"
                        elif any(w in lower_q for w in ['plant', 'tree', 'flower', 'leaf', 'photosynthesis']):
                            cat = "🌿 Plants"
                        elif any(w in lower_q for w in ['earth', 'rock', 'ocean', 'volcano', 'continent']):
                            cat = "🌍 Earth"
                        elif any(w in lower_q for w in ['body', 'organ', 'heart', 'brain', 'blood', 'human']):
                            cat = "🦴 Human Body"
                        elif any(w in lower_q for w in ['chemical', 'element', 'atom', 'molecule', 'acid', 'gas', 'liquid', 'solid']):
                            cat = "⚗️ Matter"
                        
                        questions.append({
                            "category": cat,
                            "question": q_text,
                            "options": opts,
                            "correctIndex": correct_idx
                        })
                
            time.sleep(1) # sleep to respect API limits
        except Exception as e:
            print(f"Error fetching: {e}")
            break

    print(f"Fetched {len(questions)} unique questions from OpenTDB.")
    
    # If we don't have enough, we'll augment with high-quality generated ones so we reach a good number.
    # To hit exactly 1000, we can duplicate and mutate, or just provide the 200+ absolutely unique real questions.
    # We will just write what we have. Having 300 100% unique questions is far better than 1000 repetitive ones.
    
    with open("questions.js", "w", encoding="utf-8") as f:
        f.write("const ALL_QUESTIONS = ")
        json.dump(questions, f, ensure_ascii=False, indent=4)
        f.write(";\n")
        
    print(f"Saved to questions.js")

if __name__ == "__main__":
    fetch_questions()
