from datetime import datetime
from django.utils import timezone
from .mongo_connection import get_mongo_collection
import logging
import uuid
import json
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger(__name__)

class AttentionSessionError(Exception):
    """Custom exception for attention session operations"""
    pass

def create_attention_session(user_id: str, video_id: str, taller_id: str = None) -> Tuple[str, str]:
    """
    Create a new attention session for video or taller
    
    Args:
        user_id: Django user ID
        video_id: Video ID (required)
        taller_id: Taller ID (optional, for taller sessions)
    
    Returns:
        Tuple of (mongo_inserted_id, session_id)
    
    Raises:
        AttentionSessionError: If session creation fails
    """
    try:
        session_id = str(uuid.uuid4())
        
        session_data = {
            "session_id": session_id,
            "user_id": str(user_id),
            "video_id": str(video_id),
            "taller_id": str(taller_id) if taller_id else None,
            "start_time": timezone.now(),  # Usar timezone de Django
            "end_time": None,
            "status": "active",  # active, completed, failed
            "datasets": {
                "daisee": {"version": "simplified-v1"},
                "hpod9": {"version": "simplified-9poses"}
            },
            "frames": [],
            "metrics": {
                "attention_threshold": 50,
                "min_face_confidence": 0.5,
                "analysis_version": "1.2"
            },
            "device_info": {
                "resolution": "640x480",
                "platform": "web"
            },
            "created_at": timezone.now(),
            "updated_at": timezone.now(),
            "frame_count": 0,
            "total_attention_score": 0.0,
            "average_attention_score": 0.0
        }
        
        collection = get_mongo_collection()
        result = collection.insert_one(session_data)
        
        logger.info(f"Created attention session: {session_id} for user: {user_id}, video: {video_id}")
        return str(result.inserted_id), session_id
        
    except Exception as e:
        logger.error(f"Failed to create attention session: {str(e)}", exc_info=True)
        raise AttentionSessionError(f"Session creation failed: {str(e)}")

def add_frames_batch(session_id: str, frames_batch: List[Dict[str, Any]]) -> int:
    """
    Add a batch of frames to an existing session
    
    Args:
        session_id: The session identifier
        frames_batch: List of frame data dictionaries
    
    Returns:
        Number of modified documents (should be 1 if successful)
    
    Raises:
        AttentionSessionError: If batch insertion fails
    """
    if not frames_batch:
        logger.warning(f"Empty frames batch for session: {session_id}")
        return 0
    
    try:
        # Validar y preparar frames
        current_time = timezone.now()
        processed_frames = []
        total_attention = 0.0
        
        for frame in frames_batch:
            # Asegurar que cada frame tenga timestamp
            if 'timestamp' not in frame:
                frame['timestamp'] = current_time
            
            # Convertir datetime a string si es necesario para MongoDB
            if isinstance(frame['timestamp'], datetime):
                frame['timestamp'] = frame['timestamp'].isoformat()
            
            # Validar attention_score
            attention_score = frame.get('attention_score', 0.0)
            if not isinstance(attention_score, (int, float)):
                attention_score = 0.0
            
            frame['attention_score'] = float(attention_score)
            total_attention += attention_score
            processed_frames.append(frame)
        
        # Calcular promedio del batch
        avg_batch_attention = total_attention / len(processed_frames) if processed_frames else 0.0
        
        collection = get_mongo_collection()
        
        # Actualizar con pipeline de agregación para calcular promedio total
        result = collection.update_one(
            {"session_id": session_id, "status": "active"},
            {
                "$push": {"frames": {"$each": processed_frames}},
                "$set": {"updated_at": current_time.isoformat()},
                "$inc": {
                    "frame_count": len(processed_frames),
                    "total_attention_score": total_attention
                }
            }
        )
        
        if result.matched_count == 0:
            raise AttentionSessionError(f"Session {session_id} not found or not active")
        
        # Actualizar promedio general si se modificó
        if result.modified_count > 0:
            update_session_average(session_id)
        
        logger.debug(f"Added {len(processed_frames)} frames to session: {session_id}")
        return result.modified_count
        
    except Exception as e:
        logger.error(f"Failed to add frames to session {session_id}: {str(e)}", exc_info=True)
        raise AttentionSessionError(f"Frame batch insertion failed: {str(e)}")

def update_session_average(session_id: str) -> bool:
    """
    Update the average attention score for a session
    
    Args:
        session_id: The session identifier
    
    Returns:
        True if update was successful, False otherwise
    """
    try:
        collection = get_mongo_collection()
        
        # Obtener la sesión actual
        session = collection.find_one({"session_id": session_id})
        if not session:
            return False
        
        frame_count = session.get('frame_count', 0)
        total_score = session.get('total_attention_score', 0.0)
        
        if frame_count > 0:
            average_score = total_score / frame_count
            
            collection.update_one(
                {"session_id": session_id},
                {"$set": {"average_attention_score": average_score}}
            )
            
        return True
        
    except Exception as e:
        logger.error(f"Failed to update session average {session_id}: {str(e)}")
        return False

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a session by ID
    
    Args:
        session_id: The session identifier
    
    Returns:
        Session document or None if not found
    """
    try:
        collection = get_mongo_collection()
        session = collection.find_one({"session_id": session_id})
        return session
    except Exception as e:
        logger.error(f"Failed to retrieve session {session_id}: {str(e)}")
        return None

def end_attention_session(session_id: str, final_attention_percentage: float = None) -> bool:
    """
    End an attention session and mark it as completed
    
    Args:
        session_id: The session identifier
        final_attention_percentage: Final calculated attention percentage
    
    Returns:
        True if session was ended successfully, False otherwise
    """
    try:
        update_data = {
            "status": "completed",
            "end_time": timezone.now().isoformat(),
            "updated_at": timezone.now().isoformat()
        }
        
        if final_attention_percentage is not None:
            update_data["final_attention_percentage"] = float(final_attention_percentage)
        
        collection = get_mongo_collection()
        result = collection.update_one(
            {"session_id": session_id, "status": "active"},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Successfully ended session: {session_id}")
            return True
        else:
            logger.warning(f"Session {session_id} not found or already ended")
            return False
            
    except Exception as e:
        logger.error(f"Failed to end session {session_id}: {str(e)}")
        return False

def get_user_sessions(user_id: str, limit: int = 10, video_id: str = None) -> List[Dict[str, Any]]:
    """
    Get recent sessions for a user
    
    Args:
        user_id: The Django user ID
        limit: Maximum number of sessions to return
        video_id: Optional filter by video ID
    
    Returns:
        List of session documents
    """
    try:
        collection = get_mongo_collection()
        
        # Construir filtro
        filter_query = {"user_id": str(user_id)}
        if video_id:
            filter_query["video_id"] = str(video_id)
        
        sessions = list(collection.find(filter_query)
                       .sort("created_at", -1)
                       .limit(limit))
        
        return sessions
    except Exception as e:
        logger.error(f"Failed to retrieve sessions for user {user_id}: {str(e)}")
        return []

def get_session_summary(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a summary of session statistics
    
    Args:
        session_id: The session identifier
    
    Returns:
        Dictionary with session summary or None if not found
    """
    try:
        session = get_session(session_id)
        if not session:
            return None
        
        frames = session.get('frames', [])
        frame_count = len(frames)
        
        if frame_count == 0:
            return {
                'session_id': session_id,
                'frame_count': 0,
                'duration_seconds': 0,
                'average_attention': 0.0,
                'attention_distribution': {}
            }
        
        # Calcular estadísticas
        attention_scores = [f.get('attention_score', 0) for f in frames]
        
        # Calcular duración
        start_time = session.get('start_time')
        end_time = session.get('end_time')
        
        duration_seconds = 0
        if start_time and end_time:
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            if isinstance(end_time, str):
                end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            duration_seconds = (end_time - start_time).total_seconds()
        
        # Distribución de atención por rangos
        high_attention = sum(1 for score in attention_scores if score >= 70)
        medium_attention = sum(1 for score in attention_scores if 40 <= score < 70)
        low_attention = sum(1 for score in attention_scores if score < 40)
        
        return {
            'session_id': session_id,
            'user_id': session.get('user_id'),
            'video_id': session.get('video_id'),
            'taller_id': session.get('taller_id'),
            'status': session.get('status'),
            'frame_count': frame_count,
            'duration_seconds': duration_seconds,
            'average_attention': session.get('average_attention_score', 0.0),
            'attention_distribution': {
                'high': high_attention,
                'medium': medium_attention,
                'low': low_attention
            },
            'datasets_used': session.get('datasets', {}),
            'created_at': session.get('created_at'),
            'completed_at': session.get('end_time')
        }
        
    except Exception as e:
        logger.error(f"Failed to get session summary {session_id}: {str(e)}")
        return None

def update_session_status(session_id: str, status: str, additional_data: Dict[str, Any] = None) -> bool:
    """
    Update session status and optionally add additional data
    
    Args:
        session_id: The session identifier
        status: New status (active, completed, failed, paused)
        additional_data: Optional additional data to update
    
    Returns:
        True if update was successful, False otherwise
    """
    try:
        update_data = {
            "status": status,
            "updated_at": timezone.now().isoformat()
        }
        
        # Agregar end_time si se está completando o fallando
        if status in ['completed', 'failed']:
            update_data["end_time"] = timezone.now().isoformat()
        
        # Agregar datos adicionales si se proporcionan
        if additional_data:
            update_data.update(additional_data)
        
        collection = get_mongo_collection()
        result = collection.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Updated session {session_id} status to: {status}")
            return True
        else:
            logger.warning(f"Session {session_id} not found for status update")
            return False
            
    except Exception as e:
        logger.error(f"Failed to update session {session_id} status: {str(e)}")
        return False

def delete_old_sessions(days_old: int = 30) -> int:
    """
    Delete sessions older than specified days
    
    Args:
        days_old: Number of days after which to delete sessions
    
    Returns:
        Number of deleted sessions
    """
    try:
        cutoff_date = timezone.now() - timezone.timedelta(days=days_old)
        
        collection = get_mongo_collection()
        result = collection.delete_many({
            "created_at": {"$lt": cutoff_date.isoformat()}
        })
        
        deleted_count = result.deleted_count
        if deleted_count > 0:
            logger.info(f"Deleted {deleted_count} old sessions")
        
        return deleted_count
        
    except Exception as e:
        logger.error(f"Failed to delete old sessions: {str(e)}")
        return 0

def get_user_session_stats(user_id: str, days: int = 7) -> Dict[str, Any]:
    """
    Get user session statistics for the last N days
    
    Args:
        user_id: Django user ID
        days: Number of days to look back
    
    Returns:
        Dictionary with user statistics
    """
    try:
        from_date = timezone.now() - timezone.timedelta(days=days)
        
        collection = get_mongo_collection()
        
        # Agregar pipeline para estadísticas
        pipeline = [
            {
                "$match": {
                    "user_id": str(user_id),
                    "created_at": {"$gte": from_date.isoformat()},
                    "status": "completed"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_sessions": {"$sum": 1},
                    "total_frames": {"$sum": "$frame_count"},
                    "avg_attention": {"$avg": "$average_attention_score"},
                    "total_duration": {
                        "$sum": {
                            "$divide": [
                                {"$subtract": [
                                    {"$dateFromString": {"dateString": "$end_time"}},
                                    {"$dateFromString": {"dateString": "$start_time"}}
                                ]},
                                1000  # Convertir a segundos
                            ]
                        }
                    }
                }
            }
        ]
        
        result = list(collection.aggregate(pipeline))
        
        if result:
            stats = result[0]
            return {
                'user_id': user_id,
                'period_days': days,
                'total_sessions': stats.get('total_sessions', 0),
                'total_frames_analyzed': stats.get('total_frames', 0),
                'average_attention_score': round(stats.get('avg_attention', 0.0), 2),
                'total_study_time_seconds': round(stats.get('total_duration', 0.0), 2),
                'calculated_at': timezone.now().isoformat()
            }
        else:
            return {
                'user_id': user_id,
                'period_days': days,
                'total_sessions': 0,
                'total_frames_analyzed': 0,
                'average_attention_score': 0.0,
                'total_study_time_seconds': 0.0,
                'calculated_at': timezone.now().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Failed to get user stats for {user_id}: {str(e)}")
        return {
            'user_id': user_id,
            'error': str(e),
            'calculated_at': timezone.now().isoformat()
        }

def export_session_data(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Export complete session data for analysis or backup
    
    Args:
        session_id: The session identifier
    
    Returns:
        Complete session data or None if not found
    """
    try:
        session = get_session(session_id)
        if not session:
            return None
        
        # Preparar datos para exportación
        export_data = {
            'session_info': {
                'session_id': session.get('session_id'),
                'user_id': session.get('user_id'),
                'video_id': session.get('video_id'),
                'taller_id': session.get('taller_id'),
                'start_time': session.get('start_time'),
                'end_time': session.get('end_time'),
                'status': session.get('status'),
                'duration_seconds': 0
            },
            'metrics': session.get('metrics', {}),
            'device_info': session.get('device_info', {}),
            'datasets': session.get('datasets', {}),
            'summary': {
                'frame_count': session.get('frame_count', 0),
                'average_attention_score': session.get('average_attention_score', 0.0),
                'total_attention_score': session.get('total_attention_score', 0.0)
            },
            'frames': session.get('frames', []),
            'exported_at': timezone.now().isoformat()
        }
        
        # Calcular duración si hay start y end time
        start_time = session.get('start_time')
        end_time = session.get('end_time')
        if start_time and end_time:
            try:
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                if isinstance(end_time, str):
                    end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                export_data['session_info']['duration_seconds'] = (end_time - start_time).total_seconds()
            except:
                pass
        
        return export_data
        
    except Exception as e:
        logger.error(f"Failed to export session {session_id}: {str(e)}")
        return None

def cleanup_failed_sessions(hours_old: int = 24) -> int:
    """
    Clean up sessions that have been active for too long (likely failed)
    
    Args:
        hours_old: Number of hours after which to consider active sessions as failed
    
    Returns:
        Number of cleaned up sessions
    """
    try:
        cutoff_time = timezone.now() - timezone.timedelta(hours=hours_old)
        
        collection = get_mongo_collection()
        
        # Marcar sesiones activas antiguas como fallidas
        result = collection.update_many(
            {
                "status": "active",
                "created_at": {"$lt": cutoff_time.isoformat()}
            },
            {
                "$set": {
                    "status": "failed",
                    "end_time": timezone.now().isoformat(),
                    "updated_at": timezone.now().isoformat(),
                    "failure_reason": "Session timeout - exceeded maximum duration"
                }
            }
        )
        
        cleaned_count = result.modified_count
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} failed sessions")
        
        return cleaned_count
        
    except Exception as e:
        logger.error(f"Failed to cleanup failed sessions: {str(e)}")
        return 0

# Funciones de utilidad para integración con Django

def get_django_session_stats(user_id: str, video_id: str = None, taller_id: str = None) -> Dict[str, Any]:
    """
    Get session statistics formatted for Django models
    
    Args:
        user_id: Django user ID
        video_id: Optional video ID filter
        taller_id: Optional taller ID filter
    
    Returns:
        Statistics ready for Django consumption
    """
    try:
        collection = get_mongo_collection()
        
        # Construir filtro
        filter_query = {
            "user_id": str(user_id),
            "status": "completed"
        }
        
        if video_id:
            filter_query["video_id"] = str(video_id)
        if taller_id:
            filter_query["taller_id"] = str(taller_id)
        
        sessions = list(collection.find(filter_query).sort("created_at", -1))
        
        if not sessions:
            return {
                'session_count': 0,
                'average_attention': 0.0,
                'total_study_time': 0.0,
                'last_session': None
            }
        
        # Calcular estadísticas
        total_attention = sum(s.get('average_attention_score', 0) for s in sessions)
        avg_attention = total_attention / len(sessions) if sessions else 0
        
        # Calcular tiempo total de estudio
        total_seconds = 0
        for session in sessions:
            start = session.get('start_time')
            end = session.get('end_time')
            if start and end:
                try:
                    if isinstance(start, str):
                        start = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    if isinstance(end, str):
                        end = datetime.fromisoformat(end.replace('Z', '+00:00'))
                    total_seconds += (end - start).total_seconds()
                except:
                    continue
        
        return {
            'session_count': len(sessions),
            'average_attention': round(avg_attention, 2),
            'total_study_time': round(total_seconds, 2),
            'last_session': sessions[0] if sessions else None,
            'sessions': sessions[:5]  # Últimas 5 sesiones
        }
        
    except Exception as e:
        logger.error(f"Failed to get Django session stats: {str(e)}")
        return {
            'session_count': 0,
            'average_attention': 0.0,
            'total_study_time': 0.0,
            'last_session': None,
            'error': str(e)
        }
    