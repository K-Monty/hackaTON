from flask import Flask,render_template
import requests

app = Flask(__name__, template_folder='templates')
debug_log = print

def tonefull_api_call(request: str):
    result = requests.get("http://localhost:8888/" + request)  
    debug_log("Tonefull server response ",  result.content.decode('utf-8'), " to request ", request)
    return result

@app.route("/")
def serve_home():
    return render_template("index.html")

@app.route("/calling")
def serve_calling():
    return render_template("calling.html")

@app.route("/in_call")
def serve_in_call():
    tonefull_api_call("startChannel")
    return render_template("call_fetched.html")

@app.route("/call_ended")
def serve_call_ended():
    tonefull_api_call("endChannel") 
    return render_template("call_ended.html")

@app.route("/api/balance")
def get_balance():
    res = tonefull_api_call("balance")
    return res.content


app.run(debug = True)