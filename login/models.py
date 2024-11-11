from django.db import models

class Users(models.Model):
    email = models.CharField(max_length=256)
    name = models.CharField(max_length=256)
    password = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(blank=True, null=True, auto_now=True)
    class Meta:
        db_table = 'users'