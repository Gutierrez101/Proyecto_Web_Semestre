import logging 
from django.http import HttpResponseServerError

logger=logging.getLogger(__name__)

class HandleBrokenPipeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if 'Broken pipe' in str(exception):
            logger.warning(f"Broken pipe error: {exception}")
            return HttpResponseServerError("Connection was closed by client")
        return None