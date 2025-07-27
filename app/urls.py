from django.contrib import admin
from django.urls import path, include

from fantasy_football_extension.views import home_page

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('fantasy_football_extension.urls')),
    path('api/', include('api.urls')),
]
