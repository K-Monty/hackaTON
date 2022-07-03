from flask import Flask,render_template

app = Flask(__name__, template_folder='templates')

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/calling")
def calling():
    return render_template("calling.html")

app.run(debug = True)