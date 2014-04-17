/**
 * Facebook Comments Exporter
 * Creator: Allen Guo
 * Website: http://guoguo12.github.io/exporter/
 */

loginButtonClicked = function() {
  FB.login(function(response) {
    if (response.authResponse) {
      $('#loginbutton').hide();
      $('#loggedintext').fadeIn(); 
      window.uid = response.authResponse.userID;
      window.accessToken = response.authResponse.accessToken;
    } else {
      
    }
  }, {scope: 'public_profile, basic_info, user_groups, user_friends, user_status, friends_photos, friends_status'});
}

logoutButtonClicked = function() {
  FB.logout();
  $('#loggedintext').hide();
  $('#loginbutton').fadeIn(); 
}

submitLinkButtonClicked = function(event) {
  event.preventDefault(); // Prevents page redirect
  // Force login
  if (!$('#loginbutton').is(':hidden')) {
    showError('Please login above to continue.');
    return;
  }
  // Check link validity
  var url = $('#permalink-input').val();
  var node = extractNode(url);
  if (!node) {
    showError('Your URL is not valid. Please check your URL and try again.<br><br> \
               Examples of valid URLs include: \
               <ul> \
               <li>https://www.facebook.com/user_name/posts/1234567890<i> ...</i></li> \
               <li>https://www.facebook.com/groups/group_name/permalink/1234567890<i> ...</i></li> \
               <li>https://www.facebook.com/photo.php?fbid=1234567890<i> ...</i></li> \
               </ul>');
    return;
  }
  var query = '/' + node;
  FB.api(query, {access_token: window.accessToken}, function(response) {
    // Check for request failures
    if (!response) {
      showError('No response received from server.');
      return;
    }
    if (response.error) {
      showError('Request error: ' + response.error.message);
      return;
    }
    if (!response.comments) {
      showError('This post has no visible comments.');
      return;
    }
    // Request was successful
    $('#permalink-input-error').hide();
    $('#permalink-submit').text('Working...').prop('disabled', true);
    $('#datainfo').html('<i class="fa fa-cog fa-spin"></i> Gathering data...');
    $('#datareview').html('');
    extractCSV(response.comments, 'Name\tComment\tTimestamp\tLikes\n', 0);
  });
}

extractNode = function(url) {
  var accepted = /.*(permalink\/([0-9]*)\/|posts\/([0-9]*)|fbid=([0-9]*)).*/i
  var matchdata = url.match(accepted);
  if (matchdata) {
    var node = '';
    for (var i = 2; i < matchdata.length; i++) {
      var group = matchdata[i];
      if (group) {
        node = group;
        break;
      }
    }
    return node;
  } else {
    return '';
  }
}

showError = function(message) {
  $('#permalink-input-error').hide().html(message).fadeIn();
}

extractCSV = function(commentsData, csv, numComments) {
  var comments = commentsData.data;
  for (var i = 0; i < comments.length; i++) {
    var comment = comments[i];
    var name = comment.from.name;
    var message = comment.message.replace(/\n/g, ' ');
    var timestamp = comment.created_time;
    var likes = comment.like_count;
    csv += name + '\t' + message + '\t' + timestamp + '\t' + likes + '\n'
    numComments += 1;
  }
  $('#datareview').html('Number of comments processed: ' + numComments);
  var next = commentsData.paging.next;
  if (next) {
    $.getJSON(next, function(data) {
      extractCSV(data, csv, numComments);
    })
  } else {
    displayCSV(csv, numComments);
  }
}

displayCSV = function(csv, numComments) {
  $('#permalink-submit').text('Continue').prop('disabled', false);
  $('#datainfo').html('Number of comments: ' + numComments + '.');
  $('#datareview').html(tableFromCSV(csv));
  $('#csvdisplay').html(csv).height(500).fadeIn();
}

tableFromCSV = function(csv) {
  var lines = csv.split('\n');
  var output = [];
  output.push("<tr><th>" + lines[0].split("\t").join("</th><th>") + "</th></tr>");
  for (var i = 1; i < lines.length; i++) {
    var chunks = lines[i].split("\t");
    if (chunks.length > 1) {
      output.push("<tr><td>" + chunks.join("</td><td>") + "</td></tr>");
    }
  }
  output = '<table class="table table-striped table-bordered">' + output.join("") + '</table>';
  return output;
}