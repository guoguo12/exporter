loginButtonClicked = function() {
  FB.login(function(response) {
    if (response.authResponse) {
      $('#loginbutton').hide();
      $('#loggedintext').fadeIn(); 
      window.uid = response.authResponse.userID;
      window.accessToken = response.authResponse.accessToken;
    } else {
      
    }
  }, {scope: 'public_profile, basic_info, user_groups, user_friends'});
}

logoutButtonClicked = function() {
  FB.logout();
  $('#loggedintext').hide();
  $('#loginbutton').fadeIn(); 
}

submitLinkButtonClicked = function(event) {
  event.preventDefault(); // Prevents page redirect
  if (!$('#loginbutton').is(':hidden')) {
    $('#permalink-input-error').hide().html('Please login above to continue.').fadeIn();
    return;
  }
  var url = $('#permalink-input').val();
  var matchdata = url.match(/.*permalink\/([0-9]*)\/.*/);
  if (matchdata) {
    var query = '/' + matchdata[1];
    FB.api(query, {access_token: window.accessToken}, function(response) {
      if (response && !response['error']) {
        $('#permalink-input-error').hide();
        $('#permalink-submit').text('Working...').prop('disabled', true);
        $('#datainfo').html('Gathering data...');
        $('#datareview').html('');
        processData(response);
      } else {
        console.log(response);
        if (response) {
          if (response['error']) {
            $('#permalink-input-error').hide().html('Request failed: ' + response['error']['message'] + '.').fadeIn();
          } else {
            $('#permalink-input-error').hide().html('An error occurred.').fadeIn();
          }
        } else {
          $('#permalink-input-error').hide().html('No response received from server.').fadeIn();
        }
      }
    });
  } else {
    $('#permalink-input-error').hide().fadeIn();
  }
}

processData = function(node) {
  extractCSV(node['comments'], 'Name\tComment\tTimestamp\tLikes\n', 0);
}

extractCSV = function(commentsData, csv, numComments) {
  var comments = commentsData['data'];
  for (var i = 0; i < comments.length; i++) {
    var comment = comments[i];
    var name = comment['from']['name'];
    var message = comment['message'].replace(/\n/g, ' ');
    var timestamp = comment['created_time'];
    var likes = comment['like_count'];
    csv += name + '\t' + message + '\t' + timestamp + '\t' + likes + '\n'
    numComments += 1;
  }
  $('#datareview').html('Number of comments processed: ' + numComments);
  var next = commentsData['paging']['next'];
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
var lines = csv.split("\n"),
    output = [],
    i;
    output.push("<tr><th>"
                + lines[0].split("\t").join("</th><th>")
                + "</th></tr>");
for (i = 1; i < lines.length; i++) {
    var chunks = lines[i].split("\t");
    if (chunks.length > 1) {
      output.push("<tr><td>"
                + chunks.join("</td><td>")
                + "</td></tr>");
    }
}
output = '<table class="table table-striped table-bordered">' + output.join("") + '</table>';
return output;
}