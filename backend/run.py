#!/usr/bin/env python
import os
import sys
from app import app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 Starting Flask Backend Server on port {port}")
    app.run(debug=debug, host='0.0.0.0', port=port)