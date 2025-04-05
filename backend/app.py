from flask import Flask, jsonify, render_template, send_from_directory
from flask_cors import CORS
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')

CORS(app)

# Register Blueprints
from routes.auth import auth_bp
from routes.user import user_bp
from routes.pothole import pothole_bp

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(pothole_bp)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith("api"):
        return jsonify({"error": "Not Found"}), 404
    try:
        # Ensure valid user IDs are not treated as static file paths
        if os.path.exists(os.path.join(app.static_folder, path)) and not path.startswith("a942d519"):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')  # Serve React app for valid routes
    except Exception as e:
        logger.error(f"Error serving path {path}: {e}")
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    build_dir = 'pothole-detection/build'
    if not os.path.exists(build_dir):
        logger.warning(f"Build directory {build_dir} not found. The React app may need to be built first.")
    
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
