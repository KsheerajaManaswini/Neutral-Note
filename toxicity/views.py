from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.http import JsonResponse, HttpResponse
import jwt
import json
import google.generativeai as genai
from detoxify import Detoxify


# Create your views here.pip
def toxicityPage(request):
    return render(request, "toxicity.html")

@csrf_exempt
def checkToxicity(request):
    data = json.loads(request.body)
    try:
        decoded_token = jwt.decode(data["token"], settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return JsonResponse({"Message": "Session Expired"})
    except jwt.InvalidTokenError:
        return JsonResponse({"Message": "Invalid Token"})
    #Your script
    text_data = data.get("text", "")
    text_data = text_data.split(". ")
    toxicity_results = {}

    def analyze_text(sentence):
        model = Detoxify('unbiased')
        toxicity_scores = model.predict(sentence)
        
        # Check for toxicity and return a single category
        #if toxicity_scores['toxicity'] > 0.65 or toxicity_scores['severe_toxicity'] > 0.65:
            #return "toxic"
        if toxicity_scores['obscene'] > 0.65:
            return "obscene"
        elif toxicity_scores['identity_attack'] > 0.65:
            return "identity_attack"
        elif toxicity_scores['insult'] > 0.65:
            return "insult"
        elif toxicity_scores['threat'] > 0.65:
            return "threat"
        elif toxicity_scores['sexual_explicit'] > 0.65:
            return "sexual_explicit"
        return "Non-Toxic"



    def rephrase_toxic_sentences(toxic_sentence, api_key):
        # Rephrase the toxic sentence using Google Generative AI API
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        query = f"Please rephrase the following sentence to be neutral and non-offensive without adding any comments about tone or kindness: '{toxic_sentence}'"
       
        
        response = model.generate_content(query)
    

        if response.parts:
            return response.text.strip()  # Return rephrased text if available
        else:
            return "This is very harmful; there is no place for this kind of language in our world."  # Return this if rephrasing fails

    # Iterate over sentences, analyze toxicity, and rephrase if necessary
    response_data = []

    for sentence in text_data:
        category = analyze_text(sentence)
        
        # If the sentence is toxic, rephrase it
        if category != "Non-Toxic":
            api_key = "AIzaSyDuMKLxdrMnZa8akV4DXLFXmmp8OleFSzk"
            rephrased_sentence = rephrase_toxic_sentences(sentence, api_key)
        else:
            rephrased_sentence = sentence  # Keep original sentence if non-toxic
        
        response_data.append({
            "original_sentence": sentence,
            "category": category,
            "rephrased_sentence": rephrased_sentence
        })


    return JsonResponse({"result":response_data})
    