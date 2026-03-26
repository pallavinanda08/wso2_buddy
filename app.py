import streamlit as st
import google.generativeai as genai
import os

# 1. Page Setup
st.set_page_config(page_title="My AI App", page_icon="🤖")
st.title("Custom AI Assistant")

# 2. Get API Key from Streamlit Secrets
api_key = st.secrets["GEMINI_API_KEY"]
genai.configure(api_key=api_key)

# 3. Initialize Model (Using 1.5 Flash for speed/free tier)
model = genai.GenerativeModel('gemini-1.5-flash')

# 4. Simple Chat UI
if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("How can I help?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        response = model.generate_content(prompt)
        st.markdown(response.text)
        st.session_state.messages.append({"role": "assistant", "content": response.text})
