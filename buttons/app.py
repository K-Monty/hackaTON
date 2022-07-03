from flask import Flask,render_template
import requests

app = Flask(__name__, template_folder='templates')

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/calling")
def calling():
    return render_template("calling.html")

@app.route("/in_call")
def in_call():
    print("Starting payment channel with Tonfull... ")
    res = requests.get("http://localhost:8888/startCall")
    print("Tonefull server response: ",  res.content.decode('utf-8'))
    return render_template("call_fetched.html")

@app.route("/call_ended")
def call_ended():
    return render_template("call_ended.html")


app.run(debug = True)